const mongoose = require("mongoose");

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
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    unit: { type: String, default: "" },
    reason: { type: String, default: "" },
    reference: { type: String, default: "" },
    notes: { type: String, default: "" },
    performedBy: { type: String, default: "Admin" },
    // Denormalized counterparty captured at movement time: supplier name for
    // purchases, customer/buyer name for sales. The ledger is immutable.
    partyName: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockMovement", stockMovementSchema);
