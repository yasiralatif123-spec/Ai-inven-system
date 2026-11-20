const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");

// Basic auth controller stubs (register/login/logout/me)
// Extend with validation, refresh-token rotation, session persistence, etc.

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    return res.status(201).json({
      message: "User registered",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = { sub: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store auth context in session (basic example)
    req.session.userId = user._id.toString();
    req.session.role = user.role;

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE || "lax",
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE || "lax",
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    if (req.session) {
      req.session.destroy(() => {});
    }

    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res) {
  return res.status(200).json({ user: req.user || null, session: req.session || null });
}

module.exports = { register, login, logout, me };
