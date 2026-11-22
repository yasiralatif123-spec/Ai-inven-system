const express = require("express");
const request = require("supertest");
const { ipKeyGenerator } = require("express-rate-limit");
const { validate } = require("../src/middlewares/validate.middleware");
const { loginSchema } = require("../src/validators/auth.validator");
const { checkOrigin } = require("../src/middlewares/origin.middleware");
const { requireRole } = require("../src/middlewares/auth.middleware");
const {
  createLimiter,
  normalizeEmail,
} = require("../src/middlewares/rate-limit.middleware");

describe("validate middleware", () => {
  const app = express();
  app.use(express.json());
  app.post("/check", validate(loginSchema), (req, res) =>
    res.json({ ok: true, body: req.body })
  );

  test("passes valid input to the controller", async () => {
    const response = await request(app).post("/check").send({
      email: "Owner@Example.com",
      password: "Password123!",
    });
    expect(response.status).toBe(200);
    expect(response.body.body.email).toBe("Owner@Example.com");
  });

  test("returns field errors for invalid input", async () => {
    const response = await request(app)
      .post("/check")
      .send({ email: "not-an-email", password: "" });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid request");
    expect(response.body.errors.map((error) => error.path)).toEqual(
      expect.arrayContaining(["email", "password"])
    );
  });

  test("rejects unknown fields", async () => {
    const response = await request(app).post("/check").send({
      email: "owner@example.com",
      password: "Password123!",
      role: "owner",
    });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some((error) => /role/.test(error.message))
    ).toBe(true);
  });
});

describe("checkOrigin middleware", () => {
  const app = express();
  app.use(checkOrigin);
  app.all("/check", (req, res) => res.json({ ok: true }));

  test("blocks a cross-site unsafe request", async () => {
    const response = await request(app)
      .post("/check")
      .set("Origin", "https://evil.example");
    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Request origin not allowed");
  });

  test("allows a same-origin unsafe request", async () => {
    await request(app)
      .post("/check")
      .set("Origin", "http://localhost:3000")
      .expect(200);
  });

  test("accepts Referer when Origin is absent", async () => {
    await request(app)
      .post("/check")
      .set("Referer", "http://localhost:3000/settings")
      .expect(200);
  });

  test("allows non-browser clients with no origin headers", async () => {
    await request(app).post("/check").expect(200);
  });

  test("does not restrict safe methods", async () => {
    await request(app)
      .get("/check")
      .set("Origin", "https://evil.example")
      .expect(200);
  });
});

describe("requireRole middleware", () => {
  function run(role) {
    const req = { user: role ? { id: "1", role } : null };
    const res = {
      statusCode: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json() {
        return this;
      },
    };
    let nextCalled = false;
    requireRole("owner", "admin")(req, res, () => {
      nextCalled = true;
    });
    return { res, nextCalled };
  }

  test("rejects unauthenticated callers", () => {
    expect(run(null).res.statusCode).toBe(401);
  });

  test("rejects a user role", () => {
    expect(run("user").res.statusCode).toBe(403);
  });

  test("allows owner and admin", () => {
    expect(run("owner").nextCalled).toBe(true);
    expect(run("admin").nextCalled).toBe(true);
  });
});

describe("rate limiting", () => {
  test("normalizeEmail trims and lowercases", () => {
    expect(normalizeEmail("  Owner@Example.COM ")).toBe("owner@example.com");
    expect(normalizeEmail(undefined)).toBe("");
  });

  test("limits requests after the configured number of hits", async () => {
    const limiter = createLimiter({
      limitKey: "TEST_RATE_LIMIT_LIMIT",
      windowKey: "TEST_RATE_LIMIT_WINDOW",
      defaultLimit: 2,
      defaultWindow: 60 * 1000,
      message: "slow down",
      keyGenerator: (req) => ipKeyGenerator(req.ip),
    });
    const app = express();
    app.set("trust proxy", 0);
    app.use(limiter);
    app.get("/check", (req, res) => res.json({ ok: true }));

    await request(app).get("/check").expect(200);
    await request(app).get("/check").expect(200);
    const blocked = await request(app).get("/check").expect(429);
    expect(blocked.body.message).toBe("slow down");
  });
});
