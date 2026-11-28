export type StockUnit = "Piece" | "Box" | "Carton";

export const STOCK_UNITS: StockUnit[] = ["Carton", "Box", "Piece"];

// Display money is rounded to 2 decimals. Canonical per-Piece prices keep
// extra precision so unit switching and transaction totals never drift.
export const CANONICAL_PRICE_DECIMALS = 8;
const CANONICAL_PRICE_SCALE = 10 ** CANONICAL_PRICE_DECIMALS;

export const PIECES_PER_UNIT: Record<StockUnit, number> = {
  Piece: 1,
  Box: 12,
  Carton: 24,
};

export function normalizeUnit(raw: unknown): StockUnit | "" {
  const value = String(raw ?? "").trim().toLowerCase().replace(/\./g, "");
  if (value === "piece" || value === "pieces" || value === "pc" || value === "pcs") return "Piece";
  if (value === "box" || value === "boxes") return "Box";
  if (value === "carton" || value === "cartons" || value === "ctn") return "Carton";
  return "";
}

export function toBasePieces(quantity: unknown, unit: unknown): number {
  const qty = Number(quantity);
  const normalized = normalizeUnit(unit);
  if (!Number.isFinite(qty) || !normalized) return 0;
  return Math.round(qty * PIECES_PER_UNIT[normalized]);
}

export function fromBasePieces(totalPieces: unknown) {
  const total = Math.max(0, Math.trunc(Number(totalPieces) || 0));
  const cartons = Math.floor(total / 24);
  const afterCartons = total % 24;
  const boxes = Math.floor(afterCartons / 12);
  const pieces = afterCartons % 12;
  const parts: string[] = [];
  if (cartons > 0) parts.push(`${cartons} Carton${cartons === 1 ? "" : "s"}`);
  if (boxes > 0) parts.push(`${boxes} Box${boxes === 1 ? "" : "es"}`);
  if (pieces > 0 || parts.length === 0) parts.push(`${pieces} Piece${pieces === 1 ? "" : "s"}`);
  return { cartons, boxes, pieces, totalPieces: total, display: parts.join(", ") };
}

export function formatStockWithPieces(totalPieces: unknown) {
  const stock = fromBasePieces(totalPieces);
  return `${stock.display} (${stock.totalPieces} pcs)`;
}

export function unitLabel(unit: unknown): string {
  return normalizeUnit(unit) || String(unit ?? "").trim() || "Piece";
}

export function roundMoney(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 100) / 100;
}

export function roundCanonicalPrice(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return (
    Math.round((numeric + Number.EPSILON) * CANONICAL_PRICE_SCALE) /
    CANONICAL_PRICE_SCALE
  );
}

/** Reads a canonical per-Piece price without forcing display money precision. */
export function parseCanonicalPrice(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? roundCanonicalPrice(value) : null;
  }
  if (typeof value !== "string") return null;

  const text = value.trim().replace(/,/g, "");
  if (!text || !/^-?\d+(?:\.\d+)?$/.test(text)) return null;

  const amount = Number(text);
  return Number.isFinite(amount) && amount >= 0 ? roundCanonicalPrice(amount) : null;
}

/** Parses a money input without turning malformed values into zero. */
export function parseMoneyInput(value: unknown): number | null {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? roundMoney(value) : null;
  }
  if (typeof value !== "string") return null;

  const text = value.trim().replace(/,/g, "");
  if (!text) return 0;
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return null;

  const amount = Number(text);
  return Number.isFinite(amount) && amount >= 0 ? roundMoney(amount) : null;
}

export function pricePerPiece(price: unknown, unit: unknown): number | null {
  const normalized = normalizeUnit(unit);
  const amount = Number(price);
  if (!normalized || !Number.isFinite(amount)) return null;
  const factor = PIECES_PER_UNIT[normalized];
  if (factor <= 0) return null;
  return roundCanonicalPrice(amount / factor);
}

export function priceForUnit(canonicalPerPiece: unknown, unit: unknown): number | null {
  const normalized = normalizeUnit(unit);
  const amount = Number(canonicalPerPiece);
  if (!normalized || !Number.isFinite(amount)) return null;
  return roundMoney(amount * PIECES_PER_UNIT[normalized]);
}

export function convertPrice(price: unknown, fromUnit: unknown, toUnit: unknown): number | null {
  const perPiece = pricePerPiece(price, fromUnit);
  if (perPiece === null) return null;
  return priceForUnit(perPiece, toUnit);
}

/** Price basis used in labels, e.g. `Rs. 100 / Piece`. */
export function priceBasisLabel(unit: unknown): string {
  return normalizeUnit(unit) || "Piece";
}
