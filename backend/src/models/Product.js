const mongoose = require("mongoose");
require("./Business");
require("./User");
require("./Brand");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true, default: "" },
    category: { type: String, required: true, trim: true },
    // Legacy display snapshot. Kept so historical products, search and pickers
    // remain valid; create/update derive it from brandId when one is selected.
    brand: { type: String, trim: true, default: "" },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
      index: true,
    },
    description: { type: String, trim: true, default: "" },
    // Canonical prices are always stored per Piece. priceUnit records only the
    // unit the user entered prices in; it is an input/display preference.
    purchasePrice: { type: Number, default: 0, min: 0 },
    wholesalePrice: { type: Number, default: 0, min: 0 },
    retailPrice: { type: Number, default: 0, min: 0 },
    priceUnit: {
      type: String,
      enum: ["Piece", "Box", "Carton"],
      default: "Piece",
    },
    taxBracket: { type: String, default: "" },
    uom: { type: String, default: "Piece" },
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

// Phase 6: SKU uniqueness is scoped per business. The old global sku unique
// index must be dropped only via scripts/migrate-indexes.js (never on app start).
productSchema.index({ businessId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);