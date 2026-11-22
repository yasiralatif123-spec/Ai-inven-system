const mongoose = require("mongoose");
require("./Business");
require("./User");

const supplierSchema = new mongoose.Schema(
  {
    supplierCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    hub: { type: String, default: "", trim: true },
    region: { type: String, default: "", trim: true },
    taxStatus: {
      type: String,
      enum: ["standard", "exempt", "non-filer"],
      default: "standard",
    },
    address: { type: String, required: true, trim: true },
    ntn: { type: String, default: "", trim: true },
    paymentTerms: {
      type: String,
      required: true,
      enum: ["net-15", "net-30", "net-7", "cod", "advance"],
    },
    openingBalance: { type: Number, default: 0, min: 0 },
    graceDays: { type: Number, default: 5, enum: [0, 5, 10, 15] },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        index: true,
      },
    ],
    productFlavors: {
      type: Map,
      of: [String],
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ["Active", "On Hold", "Inactive"],
      default: "Active",
      index: true,
    },
    totalPurchases: { type: Number, default: 0, min: 0 },
    outstanding: { type: Number, default: 0, min: 0 },
    payableNote: { type: String, default: "Cleared / Nil", trim: true },
    payableTone: {
      type: String,
      enum: ["danger", "muted", "success"],
      default: "success",
    },
    lastPurchaseAt: { type: Date, default: null },
    createdBy: {
      type: String,
      default: "Tariq M. (Owner)",
      trim: true,
    },
    // Tenancy foundation (Phase 5). Optional until Phase 6 backfill+enforcement.
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

module.exports = mongoose.model("Supplier", supplierSchema);
