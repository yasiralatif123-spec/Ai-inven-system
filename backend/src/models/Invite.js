const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, select: false },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ["admin", "user"], required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Pending", "Accepted", "Revoked"], default: "Pending", index: true },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: { type: Date, default: null },
    acceptanceId: { type: String, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

inviteSchema.index({ businessId: 1, status: 1 });

module.exports = mongoose.model("Invite", inviteSchema);
