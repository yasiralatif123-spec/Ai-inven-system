const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendEmail } = require("../services/email.service");
const { passwordResetEmail, passwordChangedEmail } = require("../emails/templates");
const {
  issuePasswordResetToken,
  consumePasswordResetToken,
  rollbackPasswordResetToken,
} = require("../services/password-reset.service");
const { revokeAllSessionsForUser } = require("../services/session.service");
const { normalizeEmail } = require("../middlewares/rate-limit.middleware");

async function forgotPassword(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email, isActive: true });
    if (user) {
      try {
        const token = await issuePasswordResetToken(user._id);
        await sendEmail({
          to: user.email,
          ...passwordResetEmail({
            name: user.name,
            token,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          }),
        });
      } catch (error) {
        console.error("Password reset email failed:", error.message);
      }
    }
    return res.status(202).json({ message: "If the account exists, a reset link has been sent" });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const authToken = await consumePasswordResetToken(req.body.token);
    if (!authToken) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    const user = await User.findById(authToken.userId);
    if (!user || user.isActive === false) {
      await rollbackPasswordResetToken(authToken);
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    const changedAt = new Date();
    try {
      user.password = await bcrypt.hash(req.body.password, 10);
      user.passwordChangedAt = changedAt;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();
    } catch (error) {
      await rollbackPasswordResetToken(authToken);
      throw error;
    }

    await revokeAllSessionsForUser(user._id);

    try {
      await sendEmail({
        to: user.email,
        ...passwordChangedEmail({ name: user.name, changedAt }),
      });
    } catch (error) {
      console.error("Password changed email failed:", error.message);
    }

    return res.status(200).json({ message: "Password reset. Please sign in again." });
  } catch (error) {
    return next(error);
  }
}

module.exports = { forgotPassword, resetPassword };
