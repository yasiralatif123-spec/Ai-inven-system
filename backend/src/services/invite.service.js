const crypto = require("crypto");
const mongoose = require("mongoose");
const Invite = require("../models/Invite");
const { hashToken } = require("./token.service");
const { normalizeEmail } = require("../middlewares/rate-limit.middleware");

function createInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

function inviteTtlMs() {
  const value = Number(process.env.INVITE_EXPIRES_IN_HOURS || 72);
  return (Number.isFinite(value) && value > 0 ? value : 72) * 60 * 60 * 1000;
}

function inviteExpiresAt() {
  return new Date(Date.now() + inviteTtlMs());
}

// The single-use flip. Including email/status/expiry in the filter means a stale
// or wrong-email request cannot consume the invite, even under concurrency.
async function consumeInvite(rawToken, email) {
  const acceptanceId = new mongoose.Types.ObjectId().toString();
  return Invite.findOneAndUpdate(
    {
      tokenHash: hashToken(rawToken),
      email: normalizeEmail(email),
      status: "Pending",
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        status: "Accepted",
        acceptedAt: new Date(),
        acceptanceId,
      },
    },
    { new: true }
  ).populate("businessId", "name");
}

// Only the exact acceptance that failed is rolled back.
async function rollbackInviteAcceptance(invite) {
  if (!invite) return false;
  const result = await Invite.updateOne(
    {
      _id: invite._id,
      status: "Accepted",
      acceptanceId: invite.acceptanceId,
    },
    {
      $set: {
        status: "Pending",
        acceptedAt: null,
        acceptanceId: null,
      },
    }
  );
  return result.modifiedCount > 0;
}

function findValidInvite(rawToken) {
  return Invite.findOne({
    tokenHash: hashToken(rawToken),
    status: "Pending",
    expiresAt: { $gt: new Date() },
  }).populate("businessId", "name");
}

function toInviteDto(invite) {
  if (!invite) return null;
  return {
    id: String(invite._id),
    email: invite.email,
    role: invite.role,
    businessId: String(invite.businessId?._id || invite.businessId),
    businessName: invite.businessId?.name || null,
    status: invite.status,
    expiresAt: invite.expiresAt,
    acceptedAt: invite.acceptedAt || null,
    createdAt: invite.createdAt,
  };
}

module.exports = {
  createInviteToken,
  inviteExpiresAt,
  consumeInvite,
  rollbackInviteAcceptance,
  findValidInvite,
  toInviteDto,
};
