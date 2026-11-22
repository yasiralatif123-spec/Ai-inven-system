const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Business = require("../src/models/Business");
const User = require("../src/models/User");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;

    const equalsAt = arg.indexOf("=");
    if (equalsAt !== -1) {
      result[arg.slice(2, equalsAt)] = arg.slice(equalsAt + 1);
    } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      result[arg.slice(2)] = argv[index + 1];
      index += 1;
    } else {
      result[arg.slice(2)] = "true";
    }
  }
  return result;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "business";
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function runCreateOwner(options = {}) {
  const email = normalizeEmail(options.email || process.env.OWNER_EMAIL);
  const password = options.password || process.env.OWNER_PASSWORD;
  const name = String(
    options.name || process.env.OWNER_NAME || ""
  ).trim();
  const businessName = String(
    options.business || process.env.BUSINESS_NAME || name || ""
  ).trim();

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("--email must be a valid email address");
  }
  if (typeof password !== "string" || password.length < 12) {
    throw new Error("--password must be at least 12 characters long");
  }
  if (!name) {
    throw new Error("--name is required");
  }
  if (!businessName) {
    throw new Error("--business is required");
  }

  const slug = slugify(businessName);
  const foundBusiness = await Business.findOne({ slug });

  // Validate before any write so a rejected bootstrap leaves no orphan business.
  const existing = await User.findOne({ email });
  if (existing) {
    const sameBusiness =
      foundBusiness &&
      String(existing.businessId) === String(foundBusiness._id);
    if (sameBusiness && existing.role === "owner") {
      return {
        created: false,
        business: foundBusiness,
        user: existing,
        message: `Owner ${email} already exists in "${foundBusiness.name}". Nothing changed.`,
      };
    }
    throw new Error(
      `${email} already belongs to a different account/business. Refusing to modify an existing user.`
    );
  }

  const business =
    foundBusiness ||
    (await Business.create({ name: businessName, slug }));

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role: "owner",
    businessId: business._id,
    emailVerified: true,
    tokenVersion: 0,
  });

  return {
    created: true,
    business,
    user,
    message: `Created business "${business.name}" and owner ${email}.`,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await connectDB();
  try {
    const result = await runCreateOwner(options);
    console.log(result.message);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`create-owner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runCreateOwner, parseArgs, slugify, normalizeEmail };
