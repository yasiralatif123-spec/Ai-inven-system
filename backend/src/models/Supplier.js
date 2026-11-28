const mongoose = require("mongoose");
const { paymentRecordsField } = require("./PaymentRecord");
require("./Business");
require("./User");

const supplierSchema = new mongoose.Schema(
  {
    supplierCode: {
      type: String,
      required: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    hub: { type: String, default: "", trim: true },
    region: { type: String, default: "", trim: true },
    address: { type: String, required: true, trim: true },
    ntn: { type: String, default: "", trim: true },
    paymentTerms: {
      type: String,
      required: true,
      enum: ["net-15", "net-30", "net-7", "cod", "advance"],
    },
    openingBalance: { type: Number, default: 0, min: 0 },
    openingBalancePaid: { type: Number, default: 0, min: 0 },
    remainingOpeningBalance: { type: Number, default: 0, min: 0 },
    openingBalancePayments: paymentRecordsField,
    graceDays: { type: Number, default: 5, enum: [0, 5, 10, 15] },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        index: true,
      },
    ],
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
      default: "System",
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

// Phase 6B: supplierCode uniqueness scoped per business. Old global index
// dropped only via scripts/migrate-indexes.js (never on app start).
supplierSchema.index({ businessId: 1, supplierCode: 1 }, { unique: true });
supplierSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.model("Supplier", supplierSchema);
