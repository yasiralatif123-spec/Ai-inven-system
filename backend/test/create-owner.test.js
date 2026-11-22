const bcrypt = require("bcryptjs");
const { runCreateOwner, parseArgs, slugify } = require("../scripts/create-owner");
const Business = require("../src/models/Business");
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

describe("create-owner helpers", () => {
  test("parseArgs supports both --key=value and --key value", () => {
    expect(
      parseArgs([
        "--email=owner@example.com",
        "--password",
        "a long password",
        "--name",
        "Test Owner",
      ])
    ).toEqual({
      email: "owner@example.com",
      password: "a long password",
      name: "Test Owner",
    });
  });

  test("slugify produces a safe slug", () => {
    expect(slugify("  Acme Wholesale (Pvt) Ltd! ")).toBe(
      "acme-wholesale-pvt-ltd"
    );
  });
});

describe("create-owner validation", () => {
  const valid = {
    email: "owner@example.com",
    password: "a-very-strong-password",
    name: "Test Owner",
    business: "Test Business",
  };

  test("rejects an invalid email", async () => {
    await expect(runCreateOwner({ ...valid, email: "bad" })).rejects.toThrow(
      /valid email/
    );
  });

  test("rejects a short password", async () => {
    await expect(runCreateOwner({ ...valid, password: "short" })).rejects.toThrow(
      /at least 12/
    );
  });

  test("rejects a missing name", async () => {
    await expect(runCreateOwner({ ...valid, name: "" })).rejects.toThrow(
      /--name is required/
    );
  });
});

describe("create-owner bootstrap", () => {
  const options = {
    email: "Owner@Example.com",
    password: "a-very-strong-password",
    name: "Test Owner",
    business: "Acme Wholesale",
  };

  test("creates the business and a hashed owner account", async () => {
    const result = await runCreateOwner(options);

    expect(result.created).toBe(true);
    expect(result.business.slug).toBe("acme-wholesale");
    expect(result.user.role).toBe("owner");
    expect(result.user.email).toBe("owner@example.com");
    expect(result.user.emailVerified).toBe(true);
    expect(result.user.password).not.toBe(options.password);
    expect(await bcrypt.compare(options.password, result.user.password)).toBe(
      true
    );
    expect(await Business.countDocuments()).toBe(1);
    expect(await User.countDocuments()).toBe(1);
  });

  test("is idempotent for the same owner and business", async () => {
    const first = await runCreateOwner(options);
    const second = await runCreateOwner(options);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.message).toMatch(/already exists/);
    expect(await Business.countDocuments()).toBe(1);
    expect(await User.countDocuments()).toBe(1);
  });

  test("refuses to claim an email that belongs to another business", async () => {
    const otherBusiness = await createBusiness({
      name: "Other Business",
      slug: "other-business",
    });
    await createUser({
      business: otherBusiness,
      email: "owner@example.com",
      role: "admin",
    });

    await expect(runCreateOwner(options)).rejects.toThrow(
      /already belongs to a different account/
    );
    expect(await Business.countDocuments()).toBe(1);
    expect(await User.countDocuments()).toBe(1);
  });
});
