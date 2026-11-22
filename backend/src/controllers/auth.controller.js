const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { loginSchema } = require("../validators/auth.validator");
const { verifyRefreshToken, durationToMs } = require("../services/token.service");
const {
  createSession,
  rotateSession,
  revokeSessionByRefreshToken,
} = require("../services/session.service");
const { toUserDto } = require("../utils/user.dto");
const { normalizeEmail } = require("../middlewares/rate-limit.middleware");

// Equalizes timing between "no such user" and "wrong password" paths.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("not-a-real-password", 4);

function cookieOptions(maxAge) {
  const options = {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: process.env.COOKIE_SAME_SITE || "lax",
    path: "/",
    maxAge,
  };
  if (process.env.COOKIE_DOMAIN) options.domain = process.env.COOKIE_DOMAIN;
  return options;
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  const accessName = process.env.ACCESS_COOKIE_NAME || "accessToken";
  const refreshName = process.env.REFRESH_COOKIE_NAME || "refreshToken";
  const accessMaxAge = durationToMs(
    process.env.JWT_ACCESS_EXPIRES_IN,
    15 * 60 * 1000,
    "JWT_ACCESS_EXPIRES_IN"
  );
  const refreshMaxAge = durationToMs(
    process.env.JWT_REFRESH_EXPIRES_IN,
    7 * 24 * 60 * 60 * 1000,
    "JWT_REFRESH_EXPIRES_IN"
  );
  res.cookie(accessName, accessToken, cookieOptions(accessMaxAge));
  res.cookie(refreshName, refreshToken, cookieOptions(refreshMaxAge));
}

function clearAuthCookies(res) {
  const clearOptions = cookieOptions(0);
  delete clearOptions.maxAge;
  res.clearCookie(process.env.ACCESS_COOKIE_NAME || "accessToken", clearOptions);
  res.clearCookie(process.env.REFRESH_COOKIE_NAME || "refreshToken", clearOptions);
}

async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const email = normalizeEmail(parsed.data.email);
    const user = await User.findOne({ email })
      .select("+password")
      .populate("businessId", "name");

    if (!user) {
      await bcrypt.compare(parsed.data.password, DUMMY_PASSWORD_HASH);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(
      parsed.data.password,
      user.password
    );
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const tokens = await createSession({ user, req });
    setAuthCookies(res, tokens);

    return res.status(200).json({
      message: "Login successful",
      user: toUserDto(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshName = process.env.REFRESH_COOKIE_NAME || "refreshToken";
    const refreshToken = req.cookies?.[refreshName];
    if (!refreshToken) {
      return res.status(401).json({ message: "No active session" });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    if (!payload.sub || !payload.sid) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    const user = await User.findById(payload.sub).populate("businessId", "name");
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    const tokens = await rotateSession(refreshToken, user);
    if (!tokens) {
      return res.status(401).json({ message: "Session has been rotated or revoked" });
    }

    setAuthCookies(res, tokens);
    return res.status(200).json({
      message: "Session refreshed",
      user: toUserDto(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const refreshName = process.env.REFRESH_COOKIE_NAME || "refreshToken";
    const refreshToken = req.cookies?.[refreshName];
    if (refreshToken) {
      await revokeSessionByRefreshToken(refreshToken);
    }
    clearAuthCookies(res);
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.status(200).json({ user: req.user || null });
}

module.exports = { login, refresh, logout, me };
