const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const DURATION_UNITS_MS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  y: 365 * 24 * 60 * 60 * 1000,
};

function durationToMs(value, fallbackMs, label) {
  if (value === undefined || value === null || value === "") return fallbackMs;
  if (typeof value === "number" && Number.isFinite(value)) return value * 1000;

  const match = /^(\d+)\s*(ms|s|m|h|d|w|y)$/i.exec(String(value).trim());
  if (!match) {
    throw new Error(`Invalid ${label}: "${value}". Use a value like 15m or 7d.`);
  }
  return Number(match[1]) * DURATION_UNITS_MS[match[2].toLowerCase()];
}

function signAccessToken({ userId, businessId, role, sid, tokenVersion = 0 }) {
  return jwt.sign(
    {
      sub: String(userId),
      businessId: businessId ? String(businessId) : null,
      role,
      sid,
      ver: tokenVersion,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
}

function signRefreshToken({ userId, sid }) {
  return jwt.sign(
    { sub: String(userId), sid },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      jwtid: crypto.randomBytes(16).toString("hex"),
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function hashToken(token) {
  return crypto
    .createHmac("sha256", process.env.TOKEN_PEPPER)
    .update(token)
    .digest("hex");
}

function getRefreshTtlMs() {
  return durationToMs(
    process.env.JWT_REFRESH_EXPIRES_IN,
    7 * 24 * 60 * 60 * 1000,
    "JWT_REFRESH_EXPIRES_IN"
  );
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTtlMs,
  durationToMs,
};
