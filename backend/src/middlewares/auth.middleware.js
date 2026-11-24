const User = require("../models/User");
const { verifyAccessToken } = require("../services/token.service");
const { findActiveSessionBySid } = require("../services/session.service");
const { toUserDto } = require("../utils/user.dto");

function getAccessToken(req) {
  const cookieName = process.env.ACCESS_COOKIE_NAME || "accessToken";
  if (req.cookies?.[cookieName]) return req.cookies[cookieName];

  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }
  return null;
}

async function authenticate(req, res, next) {
  try {
    const token = getAccessToken(req);
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    if (!payload.sub || !payload.sid) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    const session = await findActiveSessionBySid(payload.sid);
    if (!session || String(session.userId) !== String(payload.sub)) {
      return res.status(401).json({ message: "Session has been revoked" });
    }

    const user = await User.findById(payload.sub);
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "Session has been revoked" });
    }
    if ((user.tokenVersion || 0) !== (payload.ver || 0)) {
      return res.status(401).json({ message: "Session has been revoked" });
    }

    req.user = toUserDto(user);
    req.auth = {
      sid: payload.sid,
      id: String(user._id),
      businessId: String(session.businessId),
      ownerName: String(user.name || "").trim(),
      tokenVersion: user.tokenVersion || 0,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
}

module.exports = { authenticate, requireRole, getAccessToken };
