const request = require("supertest");
const bcrypt = require("bcryptjs");

jest.mock("../src/services/email.service", () => ({
  sendEmail: jest.fn().mockResolvedValue({ delivered: false, preview: true }),
  isConfigured: jest.fn(() => false),
}));

const app = require("../src/app");
const Invite = require("../src/models/Invite");
const User = require("../src/models/User");
const { hashToken } = require("../src/services/token.service");
const emailService = require("../src/services/email.service");
const { createBusiness, createUser } = require("./helpers/auth");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} = require("./helpers/test-db");

beforeAll(async () => {
  await connectTestDB();
});
afterEach(async () => {
  emailService.sendEmail.mockReset();
  emailService.sendEmail.mockResolvedValue({ delivered: false, preview: true });
  await clearTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});

function cookieHeader(response) {
  return (response.headers["set-cookie"] || [])
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

async function loginAs(email, password = "Password123!") {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return cookieHeader(res);
}

describe("invite flow", () => {
  test("owner can create an invite and it is stored hashed/pending", async () => {
    const business = await createBusiness({ name: "Acme" });
    await createUser({ business, email: "owner@example.com", role: "owner" });
    const ownerCookies = await loginAs("owner@example.com");

    const res = await request(app)
      .post("/api/auth/invites")
      .set("Cookie", ownerCookies)
      .send({ email: "newuser@example.com", role: "user" });

    expect(res.status).toBe(201);
    expect(res.body.invite).toMatchObject({
      email: "newuser@example.com",
      role: "user",
      status: "Pending",
    });
    expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendEmail.mock.calls[0][0].to).toBe("newuser@example.com");
    expect(emailService.sendEmail.mock.calls[0][0].subject).toMatch(/invited/i);
    expect(emailService.sendEmail.mock.calls[0][0].html).toContain("#1F6F5C");

    const stored = await Invite.findOne({ email: "newuser@example.com" }).select("+tokenHash");
    expect(stored).toBeTruthy();
    expect(stored.status).toBe("Pending");
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.businessId.toString()).toBe(business._id.toString());
  });

  test("admin cannot invite an admin", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "admin@example.com", role: "admin", name: "Admin" });
    const cookies = await loginAs("admin@example.com");

    const res = await request(app)
      .post("/api/auth/invites")
      .set("Cookie", cookies)
      .send({ email: "other@example.com", role: "admin" });

    expect(res.status).toBe(403);
    expect(await Invite.countDocuments()).toBe(0);
  });

  test("duplicate pending invite or existing user is rejected", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com", role: "owner" });
    await createUser({ business, email: "existing@example.com", role: "user", name: "Existing" });
    const cookies = await loginAs("owner@example.com");

    const existing = await request(app)
      .post("/api/auth/invites")
      .set("Cookie", cookies)
      .send({ email: "existing@example.com", role: "user" });
    expect(existing.status).toBe(409);

    const first = await request(app)
      .post("/api/auth/invites")
      .set("Cookie", cookies)
      .send({ email: "pending@example.com", role: "user" });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/auth/invites")
      .set("Cookie", cookies)
      .send({ email: "pending@example.com", role: "user" });
    expect(second.status).toBe(409);
  });

  test("invite email failure does not leave a pending invite behind", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com", role: "owner" });
    const cookies = await loginAs("owner@example.com");
    emailService.sendEmail.mockRejectedValueOnce(new Error("resend down"));

    const res = await request(app)
      .post("/api/auth/invites")
      .set("Cookie", cookies)
      .send({ email: "fail@example.com", role: "user" });

    expect(res.status).toBe(502);
    expect(await Invite.countDocuments({ email: "fail@example.com" })).toBe(0);
  });

  test("validate returns invite details for a valid token and rejects invalid token", async () => {
    const business = await createBusiness({ name: "Acme" });
    const owner = await createUser({ business, email: "owner@example.com", role: "owner" });
    const rawToken = "a".repeat(32);
    await Invite.create({
      tokenHash: hashToken(rawToken),
      email: "invitee@example.com",
      role: "user",
      businessId: business._id,
      invitedBy: owner._id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const ok = await request(app)
      .post("/api/auth/invites/validate")
      .send({ token: rawToken });
    expect(ok.status).toBe(200);
    expect(ok.body.invite).toMatchObject({
      email: "invitee@example.com",
      role: "user",
      businessName: "Acme",
      status: "Pending",
    });

    const bad = await request(app)
      .post("/api/auth/invites/validate")
      .send({ token: "b".repeat(32) });
    expect(bad.status).toBe(400);
  });

  test("accept creates a user, marks invite accepted, and rejects reuse", async () => {
    const business = await createBusiness();
    const owner = await createUser({ business, email: "owner@example.com", role: "owner" });
    const rawToken = "c".repeat(32);
    await Invite.create({
      tokenHash: hashToken(rawToken),
      email: "invitee@example.com",
      role: "user",
      businessId: business._id,
      invitedBy: owner._id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const res = await request(app).post("/api/auth/invites/accept").send({
      token: rawToken,
      name: "Invitee",
      email: "invitee@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: "invitee@example.com",
      role: "user",
      businessId: business._id.toString(),
    });
    expect(res.body.user).not.toHaveProperty("password");

    const user = await User.findOne({ email: "invitee@example.com" }).select("+password");
    expect(user).toBeTruthy();
    expect(user.emailVerified).toBe(true);
    expect(await bcrypt.compare("Password123!", user.password)).toBe(true);

    const invite = await Invite.findOne({ email: "invitee@example.com" });
    expect(invite.status).toBe("Accepted");
    expect(invite.acceptedAt).toBeInstanceOf(Date);

    const reuse = await request(app).post("/api/auth/invites/accept").send({
      token: rawToken,
      name: "Invitee",
      email: "invitee@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });
    expect(reuse.status).toBe(409);
  });

  test("list and revoke invites are owner/admin only and scoped", async () => {
    const business = await createBusiness();
    const owner = await createUser({ business, email: "owner@example.com", role: "owner" });
    await createUser({ business, email: "member@example.com", role: "user", name: "Member" });
    const ownerCookies = await loginAs("owner@example.com");
    const memberCookies = await loginAs("member@example.com");

    await Invite.create({
      tokenHash: hashToken("d".repeat(32)),
      email: "pending@example.com",
      role: "user",
      businessId: business._id,
      invitedBy: owner._id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const forbidden = await request(app).get("/api/auth/invites").set("Cookie", memberCookies);
    expect(forbidden.status).toBe(403);

    const list = await request(app).get("/api/auth/invites").set("Cookie", ownerCookies);
    expect(list.status).toBe(200);
    expect(list.body.invites).toHaveLength(1);
    const inviteId = list.body.invites[0].id;

    const revoke = await request(app)
      .post(`/api/auth/invites/${inviteId}/revoke`)
      .set("Cookie", ownerCookies);
    expect(revoke.status).toBe(200);
    expect(revoke.body.invite.status).toBe("Revoked");

    const stored = await Invite.findById(inviteId);
    expect(stored.status).toBe("Revoked");
    expect(stored.revokedAt).toBeInstanceOf(Date);
  });
});
