const mongoose = require("mongoose");
const RefreshSession = require("../models/RefreshSession");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTtlMs,
} = require("./token.service");

function rawId(value) {
  if (!value) return null;
  return value._id || value;
}

async function createSession({ user, req = {} }) {
  const userId = rawId(user._id);
  const businessId = rawId(user.businessId);

  if (!userId || !businessId) {
    throw new Error("A session requires a persisted user with a businessId");
  }

  const sid = new mongoose.Types.ObjectId().toString();
  const refreshToken = signRefreshToken({ userId, sid });
  const now = new Date();
  const expiresAt = new Date(now.getTime() + getRefreshTtlMs());

  await RefreshSession.create({
    userId,
    businessId,
    sid,
    tokenHash: hashToken(refreshToken),
    expiresAt,
    lastUsedAt: now,
    ip: req.ip || null,
    userAgent: typeof req.get === "function" ? req.get("user-agent") || null : null,
  });

  const accessToken = signAccessToken({
    userId,
    businessId,
    role: user.role,
    sid,
    tokenVersion: user.tokenVersion || 0,
  });

  return { sid, accessToken, refreshToken, expiresAt };
}

function findActiveSessionBySid(sid) {
  if (!sid) return Promise.resolve(null);
  return RefreshSession.findOne({
    sid,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
}

async function rotateSession(refreshToken, user) {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload.sub || !payload.sid) return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + getRefreshTtlMs());
  const newRefreshToken = signRefreshToken({
    userId: payload.sub,
    sid: payload.sid,
  });

  // Atomic compare-and-set prevents two concurrent refreshes from both succeeding.
  const session = await RefreshSession.findOneAndUpdate(
    {
      tokenHash: hashToken(refreshToken),
      sid: payload.sid,
      userId: payload.sub,
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        tokenHash: hashToken(newRefreshToken),
        expiresAt,
        lastUsedAt: now,
      },
    },
    { new: true }
  );

  if (!session) return null;

  const accessToken = signAccessToken({
    userId: payload.sub,
    businessId: rawId(user.businessId) || session.businessId,
    role: user.role,
    sid: session.sid,
    tokenVersion: user.tokenVersion || 0,
  });

  return { session, accessToken, refreshToken: newRefreshToken, expiresAt };
}

async function revokeSessionByRefreshToken(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return false;
  }
  if (!payload.sid) return false;

  const result = await RefreshSession.updateOne(
    { sid: payload.sid, tokenHash: hashToken(refreshToken), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

async function revokeSessionBySid(sid) {
  if (!sid) return false;
  const result = await RefreshSession.updateOne(
    { sid, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

async function revokeAllSessionsForUser(userId) {
  if (!userId) return 0;
  const result = await RefreshSession.updateMany(
    { userId: rawId(userId), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  return result.modifiedCount;
}

module.exports = {
  createSession,
  findActiveSessionBySid,
  rotateSession,
  revokeSessionByRefreshToken,
  revokeSessionBySid,
  revokeAllSessionsForUser,
  rawId,
};
