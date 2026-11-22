const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const RefreshSession = require("../src/models/RefreshSession");
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

describe("user management", () => {
  test("owner can list users in their business", async () => {
    const business = await createBusiness({ name: "Acme" });
    const other = await createBusiness({ name: "Other" });
    await createUser({ business, email: "owner@example.com", role: "owner", name: "Owner" });
    await createUser({ business, email: "staff@example.com", role: "user", name: "Staff" });
    await createUser({ business: other, email: "outsider@example.com", role: "owner", name: "Outsider" });
    const cookies = await loginAs("owner@example.com");

    const res = await request(app).get("/api/auth/users").set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.users.map((u) => u.email).sort()).toEqual([
      "owner@example.com",
      "staff@example.com",
    ]);
    expect(res.body.users[0]).not.toHaveProperty("password");
  });

  test("owner can change a user role and it revokes sessions", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com", role: "owner", name: "Owner" });
    const target = await createUser({ business, email: "staff@example.com", role: "user", name: "Staff" });
    const ownerCookies = await loginAs("owner@example.com");
    const staffCookies = await loginAs("staff@example.com");
    expect(await RefreshSession.countDocuments({ userId: target._id, revokedAt: null })).toBe(1);

    const res = await request(app)
      .patch(`/api/auth/users/${target._id}/role`)
      .set("Cookie", ownerCookies)
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("admin");
    const updated = await User.findById(target._id);
    expect(updated.role).toBe("admin");
    expect(updated.tokenVersion).toBe(1);
    expect(await RefreshSession.countDocuments({ userId: target._id, revokedAt: null })).toBe(0);

    await request(app).get("/api/auth/me").set("Cookie", staffCookies).expect(401);
  });

  test("admin cannot grant admin or manage another admin/owner", async () => {
    const business = await createBusiness();
    const admin = await createUser({ business, email: "admin@example.com", role: "admin", name: "Admin" });
    const user = await createUser({ business, email: "user@example.com", role: "user", name: "User" });
    const otherAdmin = await createUser({ business, email: "admin2@example.com", role: "admin", name: "Admin2" });
    const owner = await createUser({ business, email: "owner@example.com", role: "owner", name: "Owner" });
    const adminCookies = await loginAs("admin@example.com");
    expect(admin).toBeTruthy();

    const grantAdmin = await request(app)
      .patch(`/api/auth/users/${user._id}/role`)
      .set("Cookie", adminCookies)
      .send({ role: "admin" });
    expect(grantAdmin.status).toBe(403);

    const manageAdmin = await request(app)
      .patch(`/api/auth/users/${otherAdmin._id}/deactivate`)
      .set("Cookie", adminCookies);
    expect(manageAdmin.status).toBe(403);

    const manageOwner = await request(app)
      .patch(`/api/auth/users/${owner._id}/deactivate`)
      .set("Cookie", adminCookies);
    expect(manageOwner.status).toBe(403);
  });

  test("owner can deactivate a user and self-change is blocked", async () => {
    const business = await createBusiness();
    const owner = await createUser({ business, email: "owner@example.com", role: "owner", name: "Owner" });
    const target = await createUser({ business, email: "staff@example.com", role: "user", name: "Staff" });
    const ownerCookies = await loginAs("owner@example.com");
    const staffCookies = await loginAs("staff@example.com");

    const self = await request(app)
      .patch(`/api/auth/users/${owner._id}/deactivate`)
      .set("Cookie", ownerCookies);
    expect(self.status).toBe(403);

    const res = await request(app)
      .patch(`/api/auth/users/${target._id}/deactivate`)
      .set("Cookie", ownerCookies);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("staff@example.com");

    const updated = await User.findById(target._id);
    expect(updated.isActive).toBe(false);
    expect(updated.tokenVersion).toBe(1);
    expect(await RefreshSession.countDocuments({ userId: target._id, revokedAt: null })).toBe(0);
    await request(app).get("/api/auth/me").set("Cookie", staffCookies).expect(401);
  });
});
