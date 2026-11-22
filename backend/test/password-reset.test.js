const request = require("supertest");
const bcrypt = require("bcryptjs");

jest.mock("../src/services/email.service", () => ({
  sendEmail: jest.fn().mockResolvedValue({ delivered: false, preview: true }),
  isConfigured: jest.fn(() => false),
}));

const app = require("../src/app");
const User = require("../src/models/User");
const AuthToken = require("../src/models/AuthToken");
const RefreshSession = require("../src/models/RefreshSession");
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
  jest.clearAllMocks();
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
  return { res, cookies: cookieHeader(res) };
}

describe("password reset", () => {
  test("forgot-password always returns 202 and does not reveal account existence", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com", role: "owner" });

    const known = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "owner@example.com" });
    const unknown = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(known.body.message).toBe(unknown.body.message);

    expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendEmail.mock.calls[0][0].to).toBe("owner@example.com");
    expect(emailService.sendEmail.mock.calls[0][0].subject).toMatch(/reset/i);

    const tokens = await AuthToken.find({ type: "password_reset" });
    expect(tokens).toHaveLength(1);
    expect(tokens[0].usedAt).toBeNull();
  });

  test("new forgot-password request invalidates previous unused reset tokens", async () => {
    const business = await createBusiness();
    const user = await createUser({ business, email: "owner@example.com", role: "owner" });

    await request(app).post("/api/auth/forgot-password").send({ email: "owner@example.com" });
    const first = await AuthToken.findOne({ userId: user._id, type: "password_reset" }).select("+tokenHash");
    expect(first.usedAt).toBeNull();

    await request(app).post("/api/auth/forgot-password").send({ email: "owner@example.com" });
    const tokens = await AuthToken.find({ userId: user._id, type: "password_reset" })
      .sort({ createdAt: 1 })
      .select("+tokenHash");
    expect(tokens).toHaveLength(2);
    expect(tokens[0].usedAt).toBeInstanceOf(Date);
    expect(tokens[1].usedAt).toBeNull();
  });

  test("reset-password consumes token, changes password, revokes sessions, and rejects reuse", async () => {
    const business = await createBusiness();
    const user = await createUser({ business, email: "owner@example.com", role: "owner" });
    const { cookies } = await loginAs("owner@example.com");
    expect(await RefreshSession.countDocuments({ userId: user._id, revokedAt: null })).toBe(1);

    const rawToken = "r".repeat(32);
    await AuthToken.create({
      tokenHash: hashToken(rawToken),
      userId: user._id,
      type: "password_reset",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const reset = await request(app).post("/api/auth/reset-password").send({
      token: rawToken,
      password: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });

    expect(reset.status).toBe(200);
    expect(reset.body.message).toMatch(/sign in/i);

    const updated = await User.findById(user._id).select("+password");
    expect(await bcrypt.compare("NewPassword123!", updated.password)).toBe(true);
    expect(updated.tokenVersion).toBe(1);

    const tokenDoc = await AuthToken.findOne({ userId: user._id, type: "password_reset" });
    expect(tokenDoc.usedAt).toBeInstanceOf(Date);
    expect(await RefreshSession.countDocuments({ userId: user._id, revokedAt: null })).toBe(0);

    // Old access cookie should no longer work because tokenVersion/session revoked.
    await request(app).get("/api/auth/me").set("Cookie", cookies).expect(401);

    const reuse = await request(app).post("/api/auth/reset-password").send({
      token: rawToken,
      password: "AnotherPassword123!",
      confirmPassword: "AnotherPassword123!",
    });
    expect(reuse.status).toBe(400);
  });

  test("invalid or expired reset token is rejected", async () => {
    const business = await createBusiness();
    const user = await createUser({ business, email: "owner@example.com", role: "owner" });

    await AuthToken.create({
      tokenHash: hashToken("e".repeat(32)),
      userId: user._id,
      type: "password_reset",
      expiresAt: new Date(Date.now() - 1000),
    });

    const expired = await request(app).post("/api/auth/reset-password").send({
      token: "e".repeat(32),
      password: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });
    expect(expired.status).toBe(400);

    const invalid = await request(app).post("/api/auth/reset-password").send({
      token: "f".repeat(32),
      password: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });
    expect(invalid.status).toBe(400);
  });
});
