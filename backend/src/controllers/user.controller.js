const User = require("../models/User");
const { toUserDto } = require("../utils/user.dto");
const { revokeAllSessionsForUser } = require("../services/session.service");

function businessIdFor(req) {
  return req.auth?.businessId || req.user?.businessId;
}

async function listUsers(req, res, next) {
  try {
    const users = await User.find({ businessId: businessIdFor(req) })
      .sort({ createdAt: 1 })
      .lean();
    return res.status(200).json({ users: users.map(toUserDto) });
  } catch (error) {
    return next(error);
  }
}

function canManage(req, target) {
  if (String(target._id) === String(req.user.id)) {
    return { allowed: false, message: "You cannot change your own account" };
  }
  if (String(target.businessId) !== String(businessIdFor(req))) {
    return { allowed: false, message: "User not found" };
  }
  if (target.role === "owner") {
    return { allowed: false, message: "The owner account cannot be changed here" };
  }
  if (req.user.role === "admin" && target.role === "admin") {
    return { allowed: false, message: "Only the owner can manage admins" };
  }
  return { allowed: true };
}

async function changeRole(req, res, next) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });
    const permission = canManage(req, target);
    if (!permission.allowed) return res.status(403).json({ message: permission.message });
    if (req.user.role === "admin" && req.body.role === "admin") {
      return res.status(403).json({ message: "Only the owner can grant admin" });
    }

    target.role = req.body.role;
    target.tokenVersion = (target.tokenVersion || 0) + 1;
    await target.save({ validateBeforeSave: false });
    await revokeAllSessionsForUser(target._id);

    return res.status(200).json({ message: "Role updated", user: toUserDto(target) });
  } catch (error) {
    return next(error);
  }
}

async function deactivateUser(req, res, next) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });
    const permission = canManage(req, target);
    if (!permission.allowed) return res.status(403).json({ message: permission.message });

    target.isActive = false;
    target.tokenVersion = (target.tokenVersion || 0) + 1;
    await target.save({ validateBeforeSave: false });
    await revokeAllSessionsForUser(target._id);

    return res.status(200).json({ message: "User deactivated", user: toUserDto(target) });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listUsers, changeRole, deactivateUser };
