const bcrypt = require("bcryptjs");
const Business = require("../../src/models/Business");
const User = require("../../src/models/User");

let sequence = 0;

async function createBusiness(overrides = {}) {
  sequence += 1;
  return Business.create({
    name: "Test Business",
    slug: `test-business-${sequence}-${Date.now()}`,
    ...overrides,
  });
}

async function createUser({
  business,
  email = "owner@example.com",
  password = "Password123!",
  role = "owner",
  ...overrides
} = {}) {
  return User.create({
    name: "Test Owner",
    email: email.toLowerCase(),
    password: await bcrypt.hash(password, 4),
    role,
    businessId: business ? business._id : null,
    emailVerified: true,
    tokenVersion: 0,
    ...overrides,
  });
}

module.exports = { createBusiness, createUser };
