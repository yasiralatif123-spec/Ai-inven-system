import type {
  HubKey,
  PaymentTerms,
  Supplier,
  SupplierRegion,
} from "../suppliers/types";
import type { PaymentFilter, PurchaseRecord, PurchaseStatus } from "./purchaseData";
import type {
  PurchaseDto,
  PurchaseFinancials,
  PurchaseLineItem,
} from "./types";

export function formatRs(value: number): string {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}

export function matchesPaymentFilter(purchase: PurchaseRecord, filter: PaymentFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Unpaid") return purchase.paid === 0;
  if (filter === "Paid") return purchase.remaining === 0;
  return purchase.paid > 0 && purchase.remaining > 0;
}

export function purchasesToCsv(rows: PurchaseRecord[]): string {
  const header = [
    "Purchase ID",
    "Supplier",
    "Account",
    "Date",
    "Purchased Products (Ordered / Received)",
    "Ordered Quantity",
    "Received Quantity",
    "Total Amount",
    "Paid Amount",
    "Remaining Balance",
    "Status",
  ];
  const body = rows.map((row) => [
    row.id,
    row.supplier,
    row.account,
    row.date,
    row.itemsSummary,
    String(row.orderedQuantity),
    String(row.receivedQuantity),
    String(row.total),
    String(row.paid),
    String(row.remaining),
    row.status,
  ]);

  return [header, ...body]
    .map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function formatDate(value: string | Date): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toIsoDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function roundAmount(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLineTotal(item: PurchaseLineItem): number {
  const subtotal = roundAmount(Math.max(Number(item.quantity) || 0, 0) * (Number(item.unitPrice) || 0));
  const discount = Math.min(Math.max(Number(item.discount) || 0, 0), subtotal);
  const taxRate = Math.min(Math.max(Number(item.taxRate) || 0, 0), 100);
  const tax = roundAmount(((subtotal - discount) * taxRate) / 100);
  return roundAmount(subtotal - discount + tax);
}

export function calculateLineTax(item: PurchaseLineItem): number {
  const subtotal = roundAmount(Math.max(Number(item.quantity) || 0, 0) * (Number(item.unitPrice) || 0));
  const discount = Math.min(Math.max(Number(item.discount) || 0, 0), subtotal);
  const taxRate = Math.min(Math.max(Number(item.taxRate) || 0, 0), 100);
  return roundAmount(((subtotal - discount) * taxRate) / 100);
}

export function calculatePurchaseTotals(
  items: PurchaseLineItem[],
  freight: number
): PurchaseFinancials {
  const subtotal = roundAmount(
    items.reduce(
      (sum, item) => sum + Math.max(Number(item.quantity) || 0, 0) * (Number(item.unitPrice) || 0),
      0
    )
  );
  const discount = roundAmount(
    items.reduce((sum, item) => sum + Math.min(Math.max(Number(item.discount) || 0, 0), subtotal), 0)
  );
  const tax = roundAmount(items.reduce((sum, item) => sum + calculateLineTax(item), 0));
  const safeFreight = Math.max(Number(freight) || 0, 0);

  return {
    subtotal,
    discount,
    tax,
    freight: safeFreight,
    total: roundAmount(subtotal - discount + tax + safeFreight),
  };
}

export function paymentTermsLabel(value: string): string {
  const labels: Record<string, string> = {
    "net-7": "Net 7 Days",
    "net-15": "Net 15 Days",
    "net-30": "Net 30 Days",
    cod: "Cash on Delivery",
    advance: "Advance Payment",
  };
  return labels[value] || value || "Standard Terms";
}

export function taxRateFromBracket(value?: string): number {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return 18;
  const rate = Number(match[1]);
  return Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 18;
}

export function purchaseItemsSummary(dto: PurchaseDto): string {
  return (dto.items || [])
    .map((item) => {
      const ordered = Number(item.quantity) || 0;
      const received = Number(item.receivedQuantity) || 0;
      return `${item.name}${item.flavor ? ` · ${item.flavor}` : ""} (${received}/${
        ordered
      } ${item.unit || "units"}) · ${formatRs(item.unitPrice)}`;
    })
    .join("; ");
}

export function itemRemainingQuantity(item: PurchaseDto["items"][number]): number {
  return Math.max((Number(item.quantity) || 0) - (Number(item.receivedQuantity) || 0), 0);
}

export function toPurchaseRecord(dto: PurchaseDto): PurchaseRecord {
  const total = Number(dto.financials?.total) || 0;
  const paid = Number(dto.paidAmount) || 0;
  const orderedQuantity = (dto.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
  const receivedQuantity = (dto.items || []).reduce(
    (sum, item) => sum + (Number(item.receivedQuantity) || 0),
    0
  );

  return {
    id: dto.purchaseNumber,
    supplier: dto.supplier?.name || "Unknown supplier",
    supplierId: dto.supplier?.id || "",
    account: [dto.supplier?.code && `#${dto.supplier.code}`, dto.invoiceNumber]
      .filter(Boolean)
      .join(" · ") || dto.supplier?.hub || "Saved purchase",
    date: formatDate(dto.purchaseDate),
    sortDate: toIsoDate(dto.purchaseDate),
    total,
    paid,
    remaining: Math.max(total - paid, 0),
    status: dto.status as PurchaseStatus,
    invoiceNumber: dto.invoiceNumber || "",
    itemsSummary: purchaseItemsSummary(dto),
    orderedQuantity,
    receivedQuantity,
    dto,
  };
}

function hubKeyFromString(hub: string): HubKey {
  const normalized = String(hub || "").toLowerCase();
  if (normalized.includes("karachi")) return "karachi";
  if (normalized.includes("lahore")) return "lahore";
  if (normalized.includes("faisalabad")) return "faisalabad";
  if (normalized.includes("multan")) return "multan";
  if (normalized.includes("rawalpindi")) return "rawalpindi";
  return "";
}

function regionFromHub(hub: string): SupplierRegion {
  const key = hubKeyFromString(hub);
  if (key === "karachi") return "Karachi";
  if (key === "lahore") return "Lahore";
  if (key === "faisalabad" || key === "multan") return "Faisalabad & Multan";
  return "Rawalpindi & KPK";
}

export function purchaseSupplierToSupplier(dto: PurchaseDto): Supplier {
  const terms = String(dto.supplier?.paymentTerms || "net-15") as PaymentTerms;
  const validTerms: PaymentTerms[] = ["net-15", "net-30", "net-7", "cod", "advance"];

  return {
    id: dto.supplier?.id || "",
    code: dto.supplier?.code || "",
    name: dto.supplier?.name || "",
    contact: dto.supplier?.contact || "",
    hub: dto.supplier?.hub || "",
    hubKey: hubKeyFromString(dto.supplier?.hub || ""),
    region: regionFromHub(dto.supplier?.hub || ""),
    phone: dto.supplier?.phone || "",
    email: "",
    taxStatus: "standard",
    address: dto.supplier?.address || "",
    ntn: dto.supplier?.ntn || "",
    paymentTerms: validTerms.includes(terms) ? terms : "net-15",
    openingBalance: 0,
    graceDays: 5,
    notes: "",
    createdBy: dto.createdBy || "",
    totalPurchases: 0,
    outstanding: 0,
    payableNote: "",
    payableTone: "muted",
    lastPurchase: "",
    lastPurchaseDate: "",
    createdAt: dto.createdAt || "",
    status: "Active",
    productIds: Array.isArray(dto.supplier?.productIds)
      ? dto.supplier.productIds.map(String)
      : [],
    productFlavors:
      dto.supplier?.productFlavors && typeof dto.supplier.productFlavors === "object"
        ? { ...dto.supplier.productFlavors }
        : {},
  };
}

export function matchesDateRange(
  purchase: PurchaseRecord,
  range: string,
  todayIso: string
): boolean {
  if (!todayIso || range === "Custom Date Range…") return true;
  const date = purchase.sortDate;

  if (range === "This Month · Nov 2026") {
    return date.slice(0, 7) === todayIso.slice(0, 7);
  }

  if (range === "Last 30 Days") {
    return date >= addDays(todayIso, -30) && date <= todayIso;
  }

  if (range === "Q2 FY 2026-27") {
    return date >= "2026-10-01" && date <= "2026-12-31";
  }

  return true;
}
