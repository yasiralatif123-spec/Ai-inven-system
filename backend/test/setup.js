// Jest setupFiles run before any test module is required. Load backend/.env by
// absolute path so infrastructure values such as MONGODB_TEST_URI are available
// even when the developer did not export them in the shell.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Force test-only values after dotenv so auth behavior stays deterministic and
// never depends on secrets or flags in the developer's real .env file.
process.env.NODE_ENV = "test";

const testDefaults = {
  JWT_ACCESS_SECRET: "test_only_access_secret_at_least_32_characters_long",
  JWT_REFRESH_SECRET: "test_only_refresh_secret_at_least_32_characters_long",
  TOKEN_PEPPER: "test_only_token_pepper_at_least_32_characters_long",
  JWT_ACCESS_EXPIRES_IN: "15m",
  JWT_REFRESH_EXPIRES_IN: "7d",
  COOKIE_SECURE: "false",
  COOKIE_SAME_SITE: "lax",
  ACCESS_COOKIE_NAME: "accessToken",
  REFRESH_COOKIE_NAME: "refreshToken",
  CLIENT_URL: "http://localhost:3000",
  TRUST_PROXY: "0",
  AUTH_ENFORCEMENT: "false",
  TENANT_ENFORCEMENT: "false",
  EMAIL_FROM: "StockFlow <onboarding@resend.dev>",
  APP_URL: "http://localhost:3000",
  // Keep limiters permissive in tests; limiter behavior is tested in isolation.
  RATE_LIMIT_LOGIN_LIMIT: "1000",
  RATE_LIMIT_REFRESH_LIMIT: "1000",
  RATE_LIMIT_FORGOT_PASSWORD_LIMIT: "1000",
  RATE_LIMIT_INVITE_VALIDATE_LIMIT: "1000",
};

for (const [key, value] of Object.entries(testDefaults)) {
  process.env[key] = value;
}
