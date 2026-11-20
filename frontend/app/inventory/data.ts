export type StockStatus = "critical" | "low" | "in-stock" | "optimal";

export type StockRow = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  pack: string;
  location: string;
  warehouse: string;
  available: number;
  reserved: number;
  unit: string;
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
};

export type StockMovementDto = {
  _id: string;
  product: string;
  sku: string;
  productTitle: string;
  type: MovementKind;
  direction: "in" | "out";
  quantity: number;
  previousStock: number;
  newStock: number;
  unit: string;
  reason?: string;
  reference?: string;
  notes?: string;
  performedBy?: string;
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
    badgeClass: "bg-[#FDF0EE] text-[#BA3C34] border-[#F7D1CD]",
    rowClass: "bg-[#FDF0EE]/20",
    barClass: "bg-error",
    valueClass: "text-error",
  },
  low: {
    label: "Low Stock",
    badgeClass: "bg-[#FDF6E8] text-[#B47818] border-[#F4E3C4]",
    rowClass: "bg-[#FDF6E8]/20",
    barClass: "bg-[#B47818]",
    valueClass: "text-[#B47818]",
  },
  "in-stock": {
    label: "In Stock",
    badgeClass: "bg-[#EBF5F0] text-[#2E7D58] border-[#D1E8DC]",
    rowClass: "",
    barClass: "bg-primary",
    valueClass: "text-on-surface",
  },
  optimal: {
    label: "Optimal",
    badgeClass: "bg-[#EBF5F0] text-[#2E7D58] border-[#D1E8DC]",
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
    badgeClass: "bg-[#EBF5F0] text-[#2E7D58] border-[#D1E8DC]",
    icon: "add",
  },
  sale: {
    badgeClass: "bg-surface-container text-on-surface-variant border-outline-variant",
    icon: "remove",
  },
  return: {
    badgeClass: "bg-[#FDF6E8] text-[#B47818] border-[#F4E3C4]",
    icon: "replay",
  },
  writeoff: {
    badgeClass: "bg-[#FDF0EE] text-[#BA3C34] border-[#F7D1CD]",
    icon: "delete_forever",
    titleClass: "text-error",
    rowClass: "bg-[#FDF0EE]/10",
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
