export type StockUnit = "Piece" | "Box" | "Carton";

export const STOCK_UNITS: StockUnit[] = ["Carton", "Box", "Piece"];

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
