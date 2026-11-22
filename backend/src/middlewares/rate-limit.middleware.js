const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { durationToMs } = require("../services/token.service");

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function clientIp(req) {
  return ipKeyGenerator(req.ip || "unknown");
}

function optionsFor({
  limitKey,
  windowKey,
  defaultLimit,
  defaultWindow,
  message,
  keyGenerator,
}) {
  return {
    windowMs: durationToMs(process.env[windowKey], defaultWindow, windowKey),
    limit: Number(process.env[limitKey] || defaultLimit),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator,
    message: { message },
  };
}

function createLimiter(config) {
  return rateLimit(optionsFor(config));
}

const loginLimiter = createLimiter({
  limitKey: "RATE_LIMIT_LOGIN_LIMIT",
  windowKey: "RATE_LIMIT_LOGIN_WINDOW",
  defaultLimit: 10,
  defaultWindow: 15 * 60 * 1000,
  message: "Too many login attempts. Please try again later.",
  keyGenerator: (req) => `${clientIp(req)}:${normalizeEmail(req.body?.email)}`,
});

const refreshLimiter = createLimiter({
  limitKey: "RATE_LIMIT_REFRESH_LIMIT",
  windowKey: "RATE_LIMIT_REFRESH_WINDOW",
  defaultLimit: 60,
  defaultWindow: 60 * 60 * 1000,
  message: "Too many refresh attempts. Please try again later.",
  keyGenerator: clientIp,
});

const forgotPasswordLimiter = createLimiter({
  limitKey: "RATE_LIMIT_FORGOT_PASSWORD_LIMIT",
  windowKey: "RATE_LIMIT_FORGOT_PASSWORD_WINDOW",
  defaultLimit: 3,
  defaultWindow: 60 * 60 * 1000,
  message: "Too many password reset requests. Please try again later.",
  keyGenerator: clientIp,
});

const inviteValidateLimiter = createLimiter({
  limitKey: "RATE_LIMIT_INVITE_VALIDATE_LIMIT",
  windowKey: "RATE_LIMIT_INVITE_VALIDATE_WINDOW",
  defaultLimit: 20,
  defaultWindow: 60 * 60 * 1000,
  message: "Too many invite validation attempts. Please try again later.",
  keyGenerator: clientIp,
});

module.exports = {
  loginLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
  inviteValidateLimiter,
  createLimiter,
  optionsFor,
  normalizeEmail,
  clientIp,
};
