import type { Product } from "../products/types";
import type { MovementEntry, StockMovementDto, StockRow, StockStatus } from "./data";
import { formatStockWithPieces, normalizeUnit, parseCanonicalPrice } from "../lib/units";

export function formatRs(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}

export function formatCompactRs(value: number) {
  const amount = Number(value || 0);
  if (amount >= 1_000_000) return `Rs. ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Rs. ${(amount / 1_000).toFixed(1)}K`;
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

export function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-PK");
}

export function getUnitShort(uom?: string) {
  const value = String(uom || "").toLowerCase();
  if (!value) return "units";
  if (value.includes("carton") || value.includes("case") || value.includes("ctn")) return "ctns";
  if (value.includes("crate")) return "crates";
  if (value.includes("can")) return "cans";
  if (value.includes("bale")) return "bales";
  if (value.includes("box")) return "boxes";
  if (value.includes("pack") || value.includes("pouch") || value.includes("poly")) return "pkts";
  if (value.includes("kg") || value.includes("kilogram")) return "kg";
  if (value.includes("piece") || value.includes("unit")) return "pcs";
  return "units";
}

export function deriveStockStatus(stock: number, reorderThreshold: number): StockStatus {
  if (stock <= 0) return "critical";
  if (reorderThreshold > 0) {
    if (stock < reorderThreshold * 0.5) return "critical";
    if (stock < reorderThreshold) return "low";
    if (stock < reorderThreshold * 2) return "in-stock";
  }
  return "optimal";
}

export function toStockRows(product: Product): StockRow[] {
  const stock = Math.max(0, Math.trunc(Number(product.openingStock ?? 0)));
  const reorderThreshold = Math.max(0, Math.trunc(Number(product.reorderThreshold || 0)));
  const warehouse = product.warehouse || "Unassigned";

  return [
    {
      id: product._id,
      productId: product._id,
      name: product.title,
      sku: product.sku,
      brand: product.brand || "Unbranded",
      pack: product.uom || product.category || "-",
      location: product.rackBay || warehouse,
      warehouse,
      available: stock,
      reserved: 0,
      unit: "pcs",
      stockDisplay: formatStockWithPieces(stock),
      minSafety: reorderThreshold,
      status: deriveStockStatus(stock, reorderThreshold),
      purchasePrice: parseCanonicalPrice(product.purchasePrice) ?? 0,
    },
  ];
}

export function formatMovementTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const now = new Date();
  const time = date.toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;

  return `${date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
  })}, ${time}`;
}

const MOVEMENT_LABELS: Record<StockMovementDto["type"], string> = {
  adjustment: "Stock Adjustment",
  purchase: "Purchase Received",
  sale: "Sale Dispatched",
  return: "Customer Return",
  writeoff: "Damaged / Write-off",
};

export function movementToEntry(movement: StockMovementDto): MovementEntry {
  const baseQty = Math.max(0, Number(movement.baseQuantity || movement.quantity) || 0);
  const originalQty = Math.max(0, Number(movement.originalQuantity) || 0);
  const originalUnit = normalizeUnit(movement.originalUnit || movement.unit);
  const qtyLabel =
    originalQty > 0 && originalUnit
      ? `${formatNumber(originalQty)} ${originalUnit.toLowerCase()}${originalQty === 1 ? "" : "s"} (${formatNumber(baseQty)} pcs)`
      : `${formatNumber(baseQty)} pcs`;
  const stockLine = `Stock ${formatNumber(movement.previousStock)} -> ${formatNumber(
    movement.newStock
  )} pcs`;
  const detail = movement.reason || movement.notes;
  const reference = movement.reference || "";
  const partyName = movement.partyName || "";
  const partyLabel =
    movement.type === "purchase" ? "Supplier" : movement.type === "sale" ? "Buyer" : "";

  return {
    id: movement._id,
    kind: movement.type,
    qty: `${movement.direction === "in" ? "+" : "-"}${qtyLabel}`,
    title: `${MOVEMENT_LABELS[movement.type] || "Stock Movement"}: ${movement.productTitle}`,
    sku: movement.sku,
    ref: reference || "-",
    reason: detail ? `${stockLine} | ${detail}` : `${stockLine} | No reason recorded`,
    user: movement.performedBy || "System",
    time: formatMovementTime(movement.createdAt),
    partyLabel,
    partyName,
  };
}
