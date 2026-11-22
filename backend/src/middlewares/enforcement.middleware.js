const { authenticate } = require("./auth.middleware");

function isEnabled(value) {
  return String(value).toLowerCase() === "true";
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
    req.tenantEnforced = tenantEnforced && Boolean(req.auth?.businessId);
    return next();
  });
}

module.exports = { enforceTenantAuth, isEnabled };
