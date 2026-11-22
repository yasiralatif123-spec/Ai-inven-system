const { validateAuthEnv, MIN_SECRET_LENGTH } = require("../src/config/env");

const SECRET_KEYS = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "TOKEN_PEPPER",
];

describe("validateAuthEnv", () => {
  const original = {};

  beforeEach(() => {
    for (const key of SECRET_KEYS) original[key] = process.env[key];
  });

  afterEach(() => {
    for (const key of SECRET_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  function setValidSecrets() {
    for (const key of SECRET_KEYS) {
      process.env[key] = `valid_${key.toLowerCase()}_value_long_enough_123456`;
    }
  }

  test("returns the secrets when all are strong", () => {
    setValidSecrets();
    expect(validateAuthEnv()).toEqual({
      jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
      tokenPepper: process.env.TOKEN_PEPPER,
    });
  });

  test("rejects a missing secret by name", () => {
    setValidSecrets();
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => validateAuthEnv()).toThrow(/JWT_REFRESH_SECRET/);
  });

  test(`rejects secrets shorter than ${MIN_SECRET_LENGTH} characters`, () => {
    setValidSecrets();
    process.env.TOKEN_PEPPER = "short";
    expect(() => validateAuthEnv()).toThrow(
      /shorter than 32 chars: TOKEN_PEPPER/
    );
  });

  test("rejects placeholder values", () => {
    setValidSecrets();
    process.env.JWT_ACCESS_SECRET =
      "replace_with_a_strong_random_access_secret_at_least_32_chars";
    expect(() => validateAuthEnv()).toThrow(/placeholder/);
  });
});
