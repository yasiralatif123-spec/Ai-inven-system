const mongoose = require("mongoose");

const authTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, select: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["password_reset"], required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

authTokenSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model("AuthToken", authTokenSchema);
