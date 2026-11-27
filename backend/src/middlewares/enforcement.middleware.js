const { authenticate, requireRole } = require("./auth.middleware");

function isEnabled(value) {
  return String(value).toLowerCase() === "true";
}

function hasValidBusinessContext(req) {
  const businessId = req?.auth?.businessId;
  if (!businessId) return false;
  const normalized = String(businessId).toLowerCase();
  return normalized !== "null" && normalized !== "undefined";
}

// Sensitive lifecycle routes use this instead of requireRole directly so the
// existing unauthenticated development/single-tenant mode remains unchanged.
function requireRoleWhenEnforced(...roles) {
  return (req, res, next) => {
    if (!isEnabled(process.env.AUTH_ENFORCEMENT)) return next();
    return requireRole(...roles)(req, res, next);
  };
}

/**
 * Phase 6 rollout middleware (easy to remove later).
 * - AUTH_ENFORCEMENT=false: behave as before (no auth required, no tenant scoping).
 * - AUTH_ENFORCEMENT=true: require valid authentication.
 * - TENANT_ENFORCEMENT=true (and authenticated): controllers scope by req.auth.businessId.
 */
function enforceTenantAuth(req, res, next) {
  const authEnforced = isEnabled(process.env.AUTH_ENFORCEMENT);
  const tenantEnforced = isEnabled(process.env.TENANT_ENFORCEMENT);

  if (!authEnforced) {
    req.tenantEnforced = false;
    return next();
  }

  return authenticate(req, res, (err) => {
    if (err) return next(err);
    if (!hasValidBusinessContext(req)) {
      return res.status(403).json({ message: "A valid business context is required" });
    }
    req.tenantEnforced = tenantEnforced;
    return next();
  });
}

module.exports = {
  enforceTenantAuth,
  requireRoleWhenEnforced,
  hasValidBusinessContext,
  isEnabled,
};
