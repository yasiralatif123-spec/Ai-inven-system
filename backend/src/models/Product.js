const mongoose = require("mongoose");
require("./Business");
require("./User");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, unique: true },
    barcode: { type: String, trim: true, default: "" },
    category: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    flavors: { type: [String], default: [] },
    // Per-flavor balances for flavor-wise inventory rows. Only flavors that have
    // actually been received get an entry; product-level openingStock remains
    // the authoritative total (sum of all flavor balances).
    flavorStocks: {
      type: [
        {
          flavor: { type: String, required: true, trim: true },
          quantity: { type: Number, default: 0, min: 0 },
        },
      ],
      default: [],
    },
    purchasePrice: { type: Number, default: 0 },
    wholesalePrice: { type: Number, default: 0 },
    retailPrice: { type: Number, default: 0 },
    taxBracket: { type: String, default: "" },
    uom: { type: String, default: "" },
    openingStock: { type: Number, default: 0 },
    reorderThreshold: { type: Number, default: 0 },
    warehouse: { type: String, default: "" },
    rackBay: { type: String, default: "" },
    catalogStatus: {
      type: String,
      enum: ["active", "draft", "discontinued"],
      default: "active",
    },
    batchTracking: { type: Boolean, default: false },
    expiryDate: { type: Date, default: null },
    climateControlled: { type: Boolean, default: false },
    eligibleForReturn: { type: Boolean, default: false },
    halalPsqcaCertified: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
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

module.exports = mongoose.model("Product", productSchema);