const mongoose = require("mongoose");
const { paymentRecordsField } = require("./PaymentRecord");
require("./Business");
require("./User");

const customerSchema = new mongoose.Schema(
  {
    ledgerCode: {
      type: String,
      required: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    altPhone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true, index: true },
    cityLabel: { type: String, default: "", trim: true },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    customerType: {
      type: String,
      required: true,
      enum: ["Wholesale", "Retailer", "Distributor", "Other"],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive", "Blocked"],
      default: "Active",
      index: true,
    },
    route: { type: String, default: "unassigned", trim: true, index: true },
    routeLabel: { type: String, default: "", trim: true },
    ntn: { type: String, default: "", trim: true },
    creditLimit: { type: Number, default: 0, min: 0 },
    paymentTerms: {
      type: String,
      required: true,
      enum: ["cod", "7days", "15days", "30days", "45days"],
    },
    openingBalance: { type: Number, default: 0, min: 0 },
    openingBalancePaid: { type: Number, default: 0, min: 0 },
    remainingOpeningBalance: { type: Number, default: 0, min: 0 },
    openingBalancePayments: paymentRecordsField,
    gracePeriod: {
      type: String,
      default: "none",
      enum: ["none", "3days", "5days", "7days"],
    },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
    orders: { type: Number, default: 0, min: 0 },
    totalPurchases: { type: Number, default: 0, min: 0 },
    outstanding: { type: Number, default: 0, min: 0 },
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

// Phase 6B: ledgerCode uniqueness scoped per business. Old global index
// dropped only via scripts/migrate-indexes.js (never on app start).
customerSchema.index({ businessId: 1, ledgerCode: 1 }, { unique: true });
customerSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.model("Customer", customerSchema);
