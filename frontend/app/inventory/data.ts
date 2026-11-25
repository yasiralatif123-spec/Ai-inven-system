export type StockStatus = "critical" | "low" | "in-stock" | "optimal";

export type StockRow = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  brand: string;
  pack: string;
  location: string;
  warehouse: string;
  available: number;
  reserved: number;
  unit: string;
  stockDisplay: string;
  minSafety: number;
  status: StockStatus;
  purchasePrice: number;
};

export type MovementKind = "purchase" | "sale" | "return" | "writeoff" | "adjustment";

export type MovementEntry = {
  id: string;
  kind: MovementKind;
  qty: string;
  title: string;
  sku: string;
  ref: string;
  reason: string;
  user: string;
  time: string;
  partyLabel?: string;
  partyName?: string;
};

export type StockMovementDto = {
  _id: string;
  product: string;
  sku: string;
  productTitle: string;
  type: MovementKind;
  direction: "in" | "out";
  quantity: number;
  originalQuantity?: number;
  originalUnit?: string;
  baseQuantity?: number;
  previousStock: number;
  newStock: number;
  unit: string;
  reason?: string;
  reference?: string;
  notes?: string;
  performedBy?: string;
  partyName?: string;
  createdAt: string;
  updatedAt?: string;
};

export const STOCK_STATUS_META: Record<
  StockStatus,
  {
    label: string;
    badgeClass: string;
    rowClass: string;
    barClass: string;
    valueClass: string;
  }
> = {
  critical: {
    label: "Critical Low",
    badgeClass: "bg-error-container text-error border-error-border",
    rowClass: "bg-error-container/20",
    barClass: "bg-error",
    valueClass: "text-error",
  },
  low: {
    label: "Low Stock",
    badgeClass: "bg-warning-container text-warning border-warning-border",
    rowClass: "bg-warning-container/20",
    barClass: "bg-warning",
    valueClass: "text-warning",
  },
  "in-stock": {
    label: "In Stock",
    badgeClass: "bg-success-container text-success border-success-border",
    rowClass: "",
    barClass: "bg-primary",
    valueClass: "text-on-surface",
  },
  optimal: {
    label: "Optimal",
    badgeClass: "bg-success-container text-success border-success-border",
    rowClass: "",
    barClass: "bg-primary",
    valueClass: "text-on-surface",
  },
};

export const MOVEMENT_META: Record<
  MovementKind,
  { badgeClass: string; icon: string; titleClass?: string; rowClass?: string }
> = {
  purchase: {
    badgeClass: "bg-success-container text-success border-success-border",
    icon: "add",
  },
  sale: {
    badgeClass: "bg-surface-container text-on-surface-variant border-outline-variant",
    icon: "remove",
  },
  return: {
    badgeClass: "bg-warning-container text-warning border-warning-border",
    icon: "replay",
  },
  writeoff: {
    badgeClass: "bg-error-container text-error border-error-border",
    icon: "delete_forever",
    titleClass: "text-error",
    rowClass: "bg-error-container/10",
  },
  adjustment: {
    badgeClass: "bg-surface-container text-on-surface-variant border-outline-variant",
    icon: "tune",
  },
};

export const ADJUSTMENT_REASONS = [
  "Damaged - Warehouse handling / transit damage",
  "Lost / Unaccounted inventory",
  "Expired / Past shelf life write-off",
  "Physical count correction (Cycle audit reconciliation)",
  "Supplier sample dispatch / Lab test",
  "Other (Requires explicit supervisor authorization)",
] as const;
