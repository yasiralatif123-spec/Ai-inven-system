const CANONICAL_UNITS = ["Piece", "Box", "Carton"];

// Product prices are stored canonically per Piece. Display money stays at 2
// decimals, but the canonical value needs extra precision so repeated unit
// switching and transaction totals do not drift.
const CANONICAL_PRICE_DECIMALS = 8;
const CANONICAL_PRICE_SCALE = 10 ** CANONICAL_PRICE_DECIMALS;

const PIECES_PER_UNIT = {
  piece: 1,
  pc: 1,
  pcs: 1,
  box: 12,
  carton: 24,
  ctn: 24,
};

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function normalizeUnit(raw) {
  const value = cleanString(raw).toLowerCase().replace(/\./g, "");
  if (!value) return "";
  if (value === "piece" || value === "pieces" || value === "pc" || value === "pcs") return "Piece";
  if (value === "box" || value === "boxes") return "Box";
  if (value === "carton" || value === "cartons" || value === "ctn") return "Carton";
  return "";
}

function isSupportedUnit(raw) {
  return normalizeUnit(raw) !== "";
}

function toPiecesPerUnit(raw) {
  const normalized = normalizeUnit(raw);
  if (!normalized) return null;
  return PIECES_PER_UNIT[normalized.toLowerCase()];
}

function toBasePieces(quantity, unit) {
  const qty = Number(quantity);
  const factor = toPiecesPerUnit(unit);
  if (!Number.isFinite(qty) || factor === null) return null;
  return Math.round(qty * factor);
}

/**
 * Strictly parses a stock count. Transactional stock quantities are whole
 * Pieces (or whole Boxes/Cartons), so decimals, NaN, Infinity, malformed
 * strings, and unsafe integers are rejected instead of being truncated.
 */
function parseWholeQuantity(value, { allowZero = false } = {}) {
  let quantity;

  if (typeof value === "number") {
    quantity = value;
  } else if (typeof value === "string") {
    const text = value.trim();
    if (!/^\d+$/.test(text)) return null;
    quantity = Number(text);
  } else {
    return null;
  }

  if (!Number.isSafeInteger(quantity)) return null;
  if (quantity < 0 || (!allowZero && quantity === 0)) return null;
  return quantity;
}

/** Converts a strictly validated quantity into base Pieces. */
function toBasePiecesStrict(quantity, unit, options = {}) {
  const parsed = parseWholeQuantity(quantity, { allowZero: true, ...options });
  if (parsed === null) return null;
  const factor = toPiecesPerUnit(unit);
  if (factor === null) return null;
  const base = parsed * factor;
  return Number.isSafeInteger(base) ? base : null;
}

function fromBasePieces(totalPieces) {
  const total = Math.max(0, Math.trunc(Number(totalPieces) || 0));
  const cartons = Math.floor(total / 24);
  const afterCartons = total % 24;
  const boxes = Math.floor(afterCartons / 12);
  const pieces = afterCartons % 12;
  return { cartons, boxes, pieces, totalPieces: total };
}

function formatStock(totalPieces) {
  const normalized = fromBasePieces(totalPieces);
  const { cartons, boxes, pieces, totalPieces: total } = normalized;
  const parts = [];
  if (cartons > 0) parts.push(`${cartons} Carton${cartons === 1 ? "" : "s"}`);
  if (boxes > 0) parts.push(`${boxes} Box${boxes === 1 ? "" : "es"}`);
  if (pieces > 0 || parts.length === 0) parts.push(`${pieces} Piece${pieces === 1 ? "" : "s"}`);
  return {
    cartons,
    boxes,
    pieces,
    totalPieces: total,
    display: parts.join(", "),
  };
}

function roundMoney(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 100) / 100;
}

function roundCanonicalPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return (
    Math.round((numeric + Number.EPSILON) * CANONICAL_PRICE_SCALE) /
    CANONICAL_PRICE_SCALE
  );
}

/**
 * Reads a canonical per-Piece price without forcing it to display money
 * precision. Missing or malformed values return null so callers can reject
 * them instead of silently turning them into zero.
 */
function parseCanonicalPrice(value) {
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

function pricePerPiece(price, unit) {
  const factor = toPiecesPerUnit(unit);
  const amount = Number(price);
  if (!Number.isFinite(amount) || factor === null || factor <= 0) return null;
  return roundCanonicalPrice(amount / factor);
}

function priceForUnit(pricePerPieceValue, unit) {
  const factor = toPiecesPerUnit(unit);
  const amount = Number(pricePerPieceValue);
  if (!Number.isFinite(amount) || factor === null) return null;
  return roundMoney(amount * factor);
}

function convertPrice(price, fromUnit, toUnit) {
  const perPiece = pricePerPiece(price, fromUnit);
  if (perPiece === null) return null;
  return priceForUnit(perPiece, toUnit);
}

function normalizeQuantity(value) {
  const qty = Number(value);
  if (!Number.isFinite(qty)) return null;
  return qty;
}

function assertPositiveQuantity(value) {
  const qty = normalizeQuantity(value);
  return qty !== null && qty > 0 ? qty : null;
}

/**
 * Parses a monetary request value without silently converting invalid input
 * into zero. Empty values are treated as an explicit zero so existing forms
 * can omit optional prices. Returns null for malformed, negative, or non-finite
 * values so callers can reject them.
 */
function parseMoneyInput(value) {
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

/**
 * Reads a money value saved on an existing document. Unlike parseMoneyInput,
 * a missing value is `null` so callers can distinguish a missing legacy field
 * from an explicitly saved zero.
 */
function parseStoredMoney(value) {
  if (value === undefined || value === null || value === "") return null;
  return parseMoneyInput(value);
}

module.exports = {
  CANONICAL_UNITS,
  CANONICAL_PRICE_DECIMALS,
  PIECES_PER_UNIT,
  normalizeUnit,
  isSupportedUnit,
  toPiecesPerUnit,
  toBasePieces,
  parseWholeQuantity,
  toBasePiecesStrict,
  fromBasePieces,
  formatStock,
  roundMoney,
  roundCanonicalPrice,
  parseCanonicalPrice,
  pricePerPiece,
  priceForUnit,
  convertPrice,
  parseMoneyInput,
  parseStoredMoney,
  assertPositiveQuantity,
};
