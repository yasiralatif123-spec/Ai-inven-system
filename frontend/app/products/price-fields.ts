import {
  normalizeUnit,
  parseCanonicalPrice,
  parseMoneyInput,
  priceForUnit,
  pricePerPiece,
  type StockUnit,
} from "../lib/units";
import type { Product } from "./types";

export const PRICE_FIELDS = ["purchasePrice", "wholesalePrice", "retailPrice"] as const;

export type PriceField = (typeof PRICE_FIELDS)[number];
export type CanonicalPrices = Record<PriceField, number | null>;
export type DisplayPrices = Record<PriceField, string>;

export function priceUnitFromProduct(product?: Partial<Product> | null): StockUnit {
  return normalizeUnit(product?.priceUnit) || "Piece";
}

/** Product prices are stored per Piece; null represents an unusable/invalid value. */
export function canonicalPricesFromProduct(product?: Partial<Product> | null): CanonicalPrices {
  return PRICE_FIELDS.reduce((prices, field) => {
    prices[field] = parseCanonicalPrice(product?.[field]);
    return prices;
  }, {} as CanonicalPrices);
}

export function displayPricesFromCanonical(
  canonical: CanonicalPrices,
  unit: StockUnit
): DisplayPrices {
  return PRICE_FIELDS.reduce((prices, field) => {
    const perPiece = canonical[field];
    prices[field] = perPiece === null ? "" : String(priceForUnit(perPiece, unit) ?? 0);
    return prices;
  }, {} as DisplayPrices);
}

/** Converts an edited display value back to the canonical per-Piece value. */
export function canonicalPriceFromDisplay(value: string, unit: StockUnit): number | null {
  const entered = parseMoneyInput(value);
  if (entered === null) return null;
  return pricePerPiece(entered, unit);
}

/**
 * Canonical prices are sent alongside display values so switching the entry
 * unit (especially to Piece) cannot round away per-Piece precision on save.
 */
export function appendCanonicalPrices(form: FormData, canonical: CanonicalPrices): void {
  PRICE_FIELDS.forEach((field) => {
    const value = canonical[field];
    if (value === null) return;
    const key = `canonical${field[0].toUpperCase()}${field.slice(1)}`;
    form.append(key, String(value));
  });
}
