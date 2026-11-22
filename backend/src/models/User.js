const mongoose = require("mongoose");
require("./Business");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      // TODO(Phase 5): replace with a compound unique index on (businessId, email)
      // once existing staff records have been backfilled into a business.
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "user"],
      default: "user",
    },
    // The tenant boundary. Optional only until the Phase 5 backfill runs.
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },
    // Invite acceptance proves inbox ownership, so newly created users are verified.
    emailVerified: {
      type: Boolean,
      default: true,
    },
    // Increment to revoke every access token for this user.
    tokenVersion: {
      type: Number,
      default: 0,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
