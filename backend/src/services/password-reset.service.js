const crypto = require("crypto");
const AuthToken = require("../models/AuthToken");
const { hashToken } = require("./token.service");
const { durationToMs } = require("./token.service");

function createPasswordResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function passwordResetTtlMs() {
  return durationToMs(
    process.env.PASSWORD_RESET_EXPIRES_IN,
    60 * 60 * 1000,
    "PASSWORD_RESET_EXPIRES_IN"
  );
}

async function issuePasswordResetToken(userId) {
  // A new request invalidates any earlier, still-unused links for this user.
  await AuthToken.updateMany(
    { userId, type: "password_reset", usedAt: null },
    { $set: { usedAt: new Date() } }
  );

  const rawToken = createPasswordResetToken();
  await AuthToken.create({
    tokenHash: hashToken(rawToken),
    userId,
    type: "password_reset",
    expiresAt: new Date(Date.now() + passwordResetTtlMs()),
  });
  return rawToken;
}

// Atomic single-use claim. The caller rolls back `usedAt` if the password
// update fails, so a transient error cannot permanently burn a valid link.
async function consumePasswordResetToken(rawToken) {
  const now = new Date();
  return AuthToken.findOneAndUpdate(
    {
      tokenHash: hashToken(rawToken),
      type: "password_reset",
      usedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { usedAt: now } },
    { new: true }
  ).select("+tokenHash");
}

async function rollbackPasswordResetToken(authToken) {
  if (!authToken) return false;
  const result = await AuthToken.updateOne(
    { _id: authToken._id, usedAt: authToken.usedAt },
    { $set: { usedAt: null } }
  );
  return result.modifiedCount > 0;
}

module.exports = {
  createPasswordResetToken,
  issuePasswordResetToken,
  consumePasswordResetToken,
  rollbackPasswordResetToken,
  passwordResetTtlMs,
};
