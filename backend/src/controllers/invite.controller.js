const bcrypt = require("bcryptjs");
const Invite = require("../models/Invite");
const User = require("../models/User");
const { toUserDto } = require("../utils/user.dto");
const { hashToken } = require("../services/token.service");
const { normalizeEmail } = require("../middlewares/rate-limit.middleware");
const { sendEmail } = require("../services/email.service");
const { invitationEmail } = require("../emails/templates");
const {
  createInviteToken,
  inviteExpiresAt,
  consumeInvite,
  rollbackInviteAcceptance,
  findValidInvite,
  toInviteDto,
} = require("../services/invite.service");

function badRequest(res, parsed) {
  return res.status(400).json({
    message: "Invalid request",
    errors: parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

function businessIdFor(req) {
  return req.auth?.businessId || req.user?.businessId;
}

async function createInvite(req, res, next) {
  try {
    const parsed = req.body;
    const { role } = parsed;
    const email = normalizeEmail(parsed.email);

    if (role === "owner" || (req.user.role === "admin" && role === "admin")) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const [existingUser, pendingInvite] = await Promise.all([
      User.findOne({ email }),
      Invite.findOne({ email, status: "Pending", expiresAt: { $gt: new Date() } }),
    ]);
    if (existingUser || pendingInvite) {
      return res.status(409).json({
        message: "An account or pending invitation already exists for this email",
      });
    }

    const rawToken = createInviteToken();
    const invite = await Invite.create({
      tokenHash: hashToken(rawToken),
      email,
      role,
      businessId: businessIdFor(req),
      invitedBy: req.user.id,
      expiresAt: inviteExpiresAt(),
    });

    try {
      await sendEmail({
        to: email,
        ...invitationEmail({
          email,
          role,
          businessName: req.user.businessName,
          expiresAt: invite.expiresAt,
          token: rawToken,
        }),
      });
    } catch (error) {
      await Invite.deleteOne({ _id: invite._id });
      console.error("Invitation email failed:", error.message);
      return res.status(502).json({ message: "Invitation could not be sent" });
    }

    return res.status(201).json({ message: "Invitation sent", invite: toInviteDto(invite) });
  } catch (error) {
    return next(error);
  }
}

async function validateInvite(req, res, next) {
  try {
    const invite = await findValidInvite(req.body.token);
    if (!invite) {
      return res.status(400).json({ message: "Invitation is invalid or has expired" });
    }
    return res.status(200).json({ invite: toInviteDto(invite) });
  } catch (error) {
    return next(error);
  }
}

async function acceptInvite(req, res, next) {
  try {
    const { token, name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (await User.findOne({ email })) {
      return res.status(409).json({ message: "An account already exists for this email" });
    }

    const invite = await consumeInvite(token, email);
    if (!invite) {
      return res.status(409).json({ message: "Invitation is invalid, expired, or already used" });
    }

    try {
      const user = await User.create({
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: invite.role,
        businessId: invite.businessId?._id || invite.businessId,
        emailVerified: true,
        tokenVersion: 0,
      });
      return res.status(201).json({ message: "Account created", user: toUserDto(user) });
    } catch (error) {
      const rolledBack = await rollbackInviteAcceptance(invite);
      if (!rolledBack) console.error("Invite rollback did not match:", invite.id);
      if (error.code === 11000) {
        return res.status(409).json({ message: "An account already exists for this email" });
      }
      throw error;
    }
  } catch (error) {
    return next(error);
  }
}

async function listInvites(req, res, next) {
  try {
    const invites = await Invite.find({ businessId: businessIdFor(req) })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ invites: invites.map(toInviteDto) });
  } catch (error) {
    return next(error);
  }
}

async function revokeInvite(req, res, next) {
  try {
    const invite = await Invite.findOneAndUpdate(
      { _id: req.params.id, businessId: businessIdFor(req), status: "Pending" },
      { $set: { status: "Revoked", revokedAt: new Date() } },
      { new: true }
    );
    if (!invite) return res.status(404).json({ message: "Invitation not found" });
    return res.status(200).json({ message: "Invitation revoked", invite: toInviteDto(invite) });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createInvite, validateInvite, acceptInvite, listInvites, revokeInvite };
