const express = require("express");
const {
  login,
  refresh,
  logout,
  me,
} = require("../controllers/auth.controller");
const {
  createInvite,
  validateInvite,
  acceptInvite,
  listInvites,
  revokeInvite,
} = require("../controllers/invite.controller");
const {
  forgotPassword,
  resetPassword,
} = require("../controllers/password-reset.controller");
const {
  listUsers,
  changeRole,
  deactivateUser,
} = require("../controllers/user.controller");
const { authenticate, requireRole } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  loginSchema,
  inviteCreateSchema,
  inviteValidateSchema,
  inviteAcceptSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userRoleSchema,
} = require("../validators/auth.validator");
const {
  loginLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
  inviteValidateLimiter,
} = require("../middlewares/rate-limit.middleware");

const router = express.Router();

// Session
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

// Invitations. Validation and acceptance are public: the token is the proof.
router.post(
  "/invites/validate",
  inviteValidateLimiter,
  validate(inviteValidateSchema),
  validateInvite
);
router.post("/invites/accept", validate(inviteAcceptSchema), acceptInvite);
router.get("/invites", authenticate, requireRole("owner", "admin"), listInvites);
router.post(
  "/invites",
  authenticate,
  requireRole("owner", "admin"),
  validate(inviteCreateSchema),
  createInvite
);
router.post(
  "/invites/:id/revoke",
  authenticate,
  requireRole("owner", "admin"),
  revokeInvite
);

// Password reset
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// Workspace staff management
router.get("/users", authenticate, requireRole("owner", "admin"), listUsers);
router.patch(
  "/users/:id/role",
  authenticate,
  requireRole("owner", "admin"),
  validate(userRoleSchema),
  changeRole
);
router.patch(
  "/users/:id/deactivate",
  authenticate,
  requireRole("owner", "admin"),
  deactivateUser
);

module.exports = router;
