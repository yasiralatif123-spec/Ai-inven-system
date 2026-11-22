const mongoose = require("mongoose");
require("./Business");
require("./User");

const purchaseReceiptSchema = new mongoose.Schema(
  {
    quantity: { type: Number, required: true, min: 1 },
    receivedQuantity: { type: Number, required: true, min: 0 },
    reference: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    receivedAt: { type: Date, default: Date.now },
    performedBy: {
      type: String,
      default: "Tariq M. (Owner)",
      trim: true,
    },
  },
  { _id: true }
);

const purchaseItemSchema = new mongoose.Schema({
  productId: { type: String, default: "", trim: true, index: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, default: "", trim: true },
  flavor: { type: [String], default: [], trim: true },
  quantity: { type: Number, required: true, min: 1 },
  availableStock: { type: Number, default: 0, min: 0 },
  receivedQuantity: { type: Number, default: 0, min: 0 },
  receipts: { type: [purchaseReceiptSchema], default: [] },
  unit: { type: String, default: "Carton", trim: true },
  basePrice: { type: Number, default: 0, min: 0 },
  flavorCount: { type: Number, default: 1, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 18, min: 0, max: 100 },
  taxAmount: { type: Number, default: 0, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
});

const purchasePaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, default: "Cash", trim: true },
    reference: { type: String, default: "", trim: true },
    paidAt: { type: Date, default: Date.now },
    createdBy: {
      type: String,
      default: "Tariq M. (Owner)",
      trim: true,
    },
  },
  { _id: true }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    supplier: {
      id: { type: String, default: "", trim: true, index: true },
      code: { type: String, default: "", trim: true },
      name: { type: String, required: true, trim: true },
      contact: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      hub: { type: String, default: "", trim: true },
      address: { type: String, default: "", trim: true },
      ntn: { type: String, default: "", trim: true },
      paymentTerms: { type: String, default: "", trim: true },
      productIds: { type: [String], default: [] },
      productFlavors: { type: Map, of: [String], default: () => ({}) },
    },
    purchaseDate: { type: Date, required: true },
    expectedDelivery: { type: Date, required: true },
    invoiceNumber: { type: String, default: "", trim: true },
    items: {
      type: [purchaseItemSchema],
      validate: (items) => Array.isArray(items) && items.length > 0,
    },
    financials: {
      subtotal: { type: Number, required: true, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      freight: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    paidAmount: { type: Number, default: 0, min: 0 },
    payments: { type: [purchasePaymentSchema], default: [] },
    status: {
      type: String,
      enum: ["Draft", "Ordered", "Partially Received", "Received", "Cancelled"],
      default: "Draft",
      index: true,
    },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
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

module.exports = mongoose.model("Purchase", purchaseSchema);
