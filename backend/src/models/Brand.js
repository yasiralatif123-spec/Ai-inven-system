const mongoose = require("mongoose");
require("./Business");
require("./User");

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    // Case/spacing-insensitive lookup key. Uniqueness is scoped per business.
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },
    // Audit only - never used for authorization.
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Old/global brand data does not exist. This index is created by the controlled
// migrate:indexes script, never by dropping indexes on application startup.
brandSchema.index({ businessId: 1, normalizedName: 1 }, { unique: true });
brandSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.model("Brand", brandSchema);
