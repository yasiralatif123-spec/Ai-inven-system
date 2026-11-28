import type { StockUnit } from "../lib/units";

export type Product = {
  _id: string;
  title: string;
  sku: string;
  barcode?: string;
  category: string;
  brand: string;
  brandId?: string | null;
  description?: string;
  purchasePrice?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  /** Unit used when prices were entered; stored values are always per Piece. */
  priceUnit?: StockUnit;
  uom?: string;
  openingStock?: number;
  reorderThreshold?: number;
  warehouse?: string;
  rackBay?: string;
  catalogStatus?: "active" | "draft" | "discontinued";
  batchTracking?: boolean;
  expiryDate?: string | null;
  climateControlled?: boolean;
  eligibleForReturn?: boolean;
  halalPsqcaCertified?: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt?: string;
  updatedAt?: string;
};
