import type { Product } from "./types";

export function formatRs(value?: number) {
  const n = Number(value || 0);
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getStatus(p: Product) {
  const stock = Number(p.openingStock || 0);
  const min = Number(p.reorderThreshold || 0);
  if (p.catalogStatus === "discontinued") {
    return { label: "Discontinued", cls: "bg-surface-variant text-secondary border-outline-variant" };
  }
  if (stock <= 0) {
    return { label: "Out of Stock", cls: "bg-surface-variant text-secondary border-outline-variant" };
  }
  if (min > 0 && stock <= min) {
    return { label: "Low Stock", cls: "bg-error-container text-error border-error/20" };
  }
  return { label: "Active", cls: "bg-primary-fixed/30 text-primary border-primary/20" };
}

export function getStockMeta(p: Product) {
  const stock = Number(p.openingStock || 0);
  const min = Number(p.reorderThreshold || 0);
  const unit = p.uom || "units";
  let bar = 0;
  if (stock <= 0) bar = 0;
  else if (min > 0) bar = Math.max(8, Math.min(100, Math.round((stock / (min * 2)) * 100)));
  else bar = Math.min(100, 50 + stock);
  const status = getStatus(p);
  const isLow = status.label === "Low Stock";
  const isOut = status.label === "Out of Stock";
  return {
    text: `${stock.toLocaleString()} ${unit}`,
    minText: min > 0 ? `(Min: ${min})` : p.rackBay || "",
    textColor: isOut ? "text-outline" : isLow ? "text-error" : "text-on-surface",
    minColor: isOut || isLow ? "text-error" : "text-secondary",
    bar: `${bar}%`,
    barColor: isOut ? "bg-outline" : isLow ? "bg-error" : "bg-primary",
    faded: isOut || p.catalogStatus === "discontinued",
  };
}

export function getMargin(p: Product) {
  if (!p.purchasePrice || p.purchasePrice <= 0 || p.wholesalePrice === undefined) return "-";
  return `${(((p.wholesalePrice - p.purchasePrice) / p.purchasePrice) * 100).toFixed(1)}% margin`;
}
