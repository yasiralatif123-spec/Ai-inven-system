const mongoose = require("mongoose");
require("./Business");
require("./User");

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    sku: { type: String, required: true, trim: true },
    productTitle: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["adjustment", "purchase", "sale", "return", "writeoff"],
      default: "adjustment",
    },
    direction: { type: String, enum: ["in", "out"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    originalQuantity: { type: Number, default: 0, min: 0 },
    originalUnit: { type: String, default: "", trim: true },
    baseQuantity: { type: Number, default: 0, min: 0 },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    unit: { type: String, default: "" },
    reason: { type: String, default: "" },
    reference: { type: String, default: "" },
    notes: { type: String, default: "" },
    // Set only on compensating movements. The original movement is never
    // edited or deleted; this link makes a reversal detectable and idempotent.
    reversesMovement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockMovement",
      default: null,
    },
    performedBy: { type: String, default: "System" },
    // Denormalized counterparty captured at movement time: supplier name for
    // purchases, customer/buyer name for sales. The ledger is immutable.
    partyName: { type: String, default: "" },
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

// A movement may be compensated at most once. Null/default values are excluded
// so ordinary ledger entries remain unrestricted.
stockMovementSchema.index(
  { reversesMovement: 1 },
  {
    unique: true,
    partialFilterExpression: { reversesMovement: { $type: "objectId" } },
  }
);

module.exports = mongoose.model("StockMovement", stockMovementSchema);
