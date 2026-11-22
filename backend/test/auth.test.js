const request = require("supertest");
const app = require("../src/app");
const RefreshSession = require("../src/models/RefreshSession");
const User = require("../src/models/User");
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

function namedCookie(response, name) {
  return (response.headers["set-cookie"] || []).find((cookie) =>
    cookie.startsWith(`${name}=`)
  );
}

describe("auth routes", () => {
  test("rejects an invalid login body", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "bad", password: "" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid request");
  });

  test("returns a generic error for an unknown email or wrong password", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com" });

    const unknown = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "Password123!",
    });
    const wrongPassword = await request(app).post("/api/auth/login").send({
      email: "owner@example.com",
      password: "WrongPassword123!",
    });

    expect(unknown.status).toBe(401);
    expect(unknown.body.message).toBe("Invalid email or password");
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknown.body.message);
    expect(await RefreshSession.countDocuments()).toBe(0);
  });

  test("login works when app loads without Business model pre-registered", async () => {
    const business = await createBusiness({ name: "Acme Wholesale" });
    const user = await createUser({ business, email: "owner@example.com" });

    let isolatedApp;
    let isolatedMongoose;
    jest.isolateModules(() => {
      isolatedMongoose = require("mongoose");
      isolatedApp = require("../src/app");
    });

    const uri = process.env.MONGODB_TEST_URI;
    const dbName = uri ? new URL(uri).pathname.replace(/^\//, "").split("/")[0] : undefined;
    if (isolatedMongoose.connection.readyState === 0) {
      await isolatedMongoose.connect(uri, { dbName });
    }

    try {
      const response = await request(isolatedApp).post("/api/auth/login").send({
        email: "owner@example.com",
        password: "Password123!",
      });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        id: String(user._id),
        name: "Test Owner",
        email: "owner@example.com",
        role: "owner",
        businessId: String(business._id),
        businessName: "Acme Wholesale",
        emailVerified: true,
      });
      expect(response.body.user).not.toHaveProperty("password");
    } finally {
      await isolatedMongoose.disconnect();
    }
  });

  test("login sets HTTP-only cookies and returns a safe user DTO", async () => {
    const business = await createBusiness({ name: "Acme Wholesale" });
    const user = await createUser({ business, email: "Owner@Example.com" });

    const response = await request(app).post("/api/auth/login").send({
      email: "  OWNER@example.com  ",
      password: "Password123!",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.user).toMatchObject({
      id: String(user._id),
      name: "Test Owner",
      email: "owner@example.com",
      role: "owner",
      businessId: String(business._id),
      businessName: "Acme Wholesale",
      emailVerified: true,
    });
    expect(response.body.user).not.toHaveProperty("password");
    expect(response.body.user).not.toHaveProperty("tokenVersion");

    const accessCookie = namedCookie(response, "accessToken");
    const refreshCookie = namedCookie(response, "refreshToken");
    expect(accessCookie).toMatch(/HttpOnly/i);
    expect(accessCookie).toMatch(/SameSite=Lax/i);
    expect(accessCookie).toMatch(/Path=\//);
    expect(refreshCookie).toMatch(/HttpOnly/i);
    expect(response.body).not.toHaveProperty("accessToken");
    expect(response.body).not.toHaveProperty("refreshToken");

    expect(await RefreshSession.countDocuments()).toBe(1);
    const stored = await User.findById(user._id);
    expect(stored.lastLoginAt).toBeInstanceOf(Date);
  });

  test("me requires a session and returns the same DTO", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com" });

    await request(app).get("/api/auth/me").expect(401);

    const login = await request(app).post("/api/auth/login").send({
      email: "owner@example.com",
      password: "Password123!",
    });
    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader(login));

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("owner@example.com");
    expect(response.body.user).not.toHaveProperty("password");
  });

  test("refresh rotates the token and rejects reuse of the old one", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com" });
    const login = await request(app).post("/api/auth/login").send({
      email: "owner@example.com",
      password: "Password123!",
    });
    const firstCookies = cookieHeader(login);

    const refreshed = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", firstCookies);

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.message).toBe("Session refreshed");
    const newCookies = cookieHeader(refreshed);
    expect(newCookies).not.toBe(firstCookies);

    const me = await request(app)
      .get("/api/auth/me")
      .set("Cookie", newCookies);
    expect(me.status).toBe(200);

    const reused = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", firstCookies);
    expect(reused.status).toBe(401);

    const stillValid = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", newCookies);
    expect(stillValid.status).toBe(200);
  });

  test("refresh without a cookie is rejected", async () => {
    const response = await request(app).post("/api/auth/refresh");
    expect(response.status).toBe(401);
  });

  test("logout revokes the session so the access token stops working", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com" });
    const login = await request(app).post("/api/auth/login").send({
      email: "owner@example.com",
      password: "Password123!",
    });
    const cookies = cookieHeader(login);

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookies);
    expect(logout.status).toBe(200);
    expect(namedCookie(logout, "accessToken")).toMatch(/Expires=Thu, 01 Jan 1970/i);

    await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookies)
      .expect(401);
    const sessions = await RefreshSession.find();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].revokedAt).toBeInstanceOf(Date);
  });

  test("an inactive account cannot log in", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com", isActive: false });

    const response = await request(app).post("/api/auth/login").send({
      email: "owner@example.com",
      password: "Password123!",
    });
    expect(response.status).toBe(403);
    expect(await RefreshSession.countDocuments()).toBe(0);
  });

  test("incrementing tokenVersion invalidates an existing access token", async () => {
    const business = await createBusiness();
    const user = await createUser({ business, email: "owner@example.com" });
    const login = await request(app).post("/api/auth/login").send({
      email: "owner@example.com",
      password: "Password123!",
    });

    await User.updateOne({ _id: user._id }, { $inc: { tokenVersion: 1 } });
    await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader(login))
      .expect(401);
  });

  test("public registration is no longer available", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "X", email: "x@example.com", password: "Password123!" })
      .expect(404);
  });
});
