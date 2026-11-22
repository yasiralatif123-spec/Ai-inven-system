function toUserDto(user) {
  if (!user) return null;

  const populatedBusiness =
    user.businessId && typeof user.businessId === "object" && user.businessId.name
      ? user.businessId
      : null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    businessId: populatedBusiness
      ? String(populatedBusiness._id)
      : user.businessId
        ? String(user.businessId)
        : null,
    businessName: populatedBusiness?.name || null,
    emailVerified: user.emailVerified !== false,
    lastLoginAt: user.lastLoginAt || null,
  };
}

module.exports = { toUserDto };
