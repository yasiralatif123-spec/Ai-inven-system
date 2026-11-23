const mongoose = require("mongoose");
require("./Business");
require("./User");

const saleOrderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: "", trim: true },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    quantity: { type: Number, required: true, min: 1 },
    baseQuantity: { type: Number, default: 0, min: 0 },
    unitLabel: { type: String, default: "pcs", trim: true },
    basePrice: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    available: { type: Number, default: 0, min: 0 },
    stockDeducted: { type: Boolean, default: false },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const saleOrderCreditSchema = new mongoose.Schema(
  {
    accountName: { type: String, default: "", trim: true },
    ntn: { type: String, default: "", trim: true },
    creditLimit: { type: Number, default: 0, min: 0 },
    currentDues: { type: Number, default: 0, min: 0 },
    available: { type: Number, default: 0 },
  },
  { _id: false }
);

const saleOrderWarningSchema = new mongoose.Schema(
  {
    exposure: { type: Number, default: 0 },
    overBy: { type: Number, default: 0 },
    approvedBy: { type: String, default: "", trim: true },
    reasons: { type: [String], default: [] },
    defaultReason: { type: String, default: "", trim: true },
    defaultNote: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const saleOrderFinancialsSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    freight: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paid: { type: Number, default: 0, min: 0 },
    outstanding: { type: Number, default: 0, min: 0 },
    dueDate: { type: String, default: "" },
  },
  { _id: false }
);

const saleOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customer: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
        index: true,
      },
      name: { type: String, required: true, trim: true },
      phone: { type: String, default: "", trim: true },
      location: { type: String, default: "", trim: true },
    },
    hub: { type: String, default: "", trim: true },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },
    paymentLabel: { type: String, default: "" },
    paymentMethod: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["Pending Approval", "Processing", "Packed", "Dispatched", "Delivered", "Credit Hold", "Cancelled"],
      default: "Pending Approval",
      index: true,
    },
    createdBy: { type: String, default: "Tariq M. (Owner)", trim: true },
    bay: { type: String, default: "Counter", trim: true },
    items: { type: [saleOrderItemSchema], default: [] },
    skuCount: { type: Number, default: 0, min: 0 },
    unitCount: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 },
    credit: { type: saleOrderCreditSchema, default: () => ({}) },
    warning: { type: saleOrderWarningSchema, default: null },
    financials: { type: saleOrderFinancialsSchema, required: true },
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

// Phase 6B: orderNumber uniqueness scoped per business. Old global index
// dropped only via scripts/migrate-indexes.js (never on app start).
saleOrderSchema.index({ businessId: 1, orderNumber: 1 }, { unique: true });
saleOrderSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.model("SaleOrder", saleOrderSchema);
