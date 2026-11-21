import type { PurchaseDto } from "./types";

export type PurchaseStatus =
  | "Draft"
  | "Ordered"
  | "Partially Received"
  | "Received"
  | "Cancelled";

export type PurchaseRecord = {
  id: string;
  supplier: string;
  supplierId: string;
  account: string;
  date: string;
  sortDate: string;
  total: number;
  paid: number;
  remaining: number;
  status: PurchaseStatus;
  invoiceNumber: string;
  itemsSummary: string;
  orderedQuantity: number;
  receivedQuantity: number;
  dto: PurchaseDto;
};

export const STATUS_OPTIONS: Array<"All Statuses" | PurchaseStatus> = [
  "All Statuses",
  "Draft",
  "Ordered",
  "Partially Received",
  "Received",
  "Cancelled",
];

export const DATE_OPTIONS = [
  "This Month · Nov 2026",
  "Last 30 Days",
  "Q2 FY 2026-27",
  "Custom Date Range…",
];

export const SORT_OPTIONS = [
  "Sort: Date (Newest first)",
  "Sort: Date (Oldest first)",
  "Sort: Total Amount (High → Low)",
  "Sort: Remaining Balance (High → Low)",
  "Sort: Supplier (A-Z)",
];

export type PaymentFilter = "All" | "Unpaid" | "Partial" | "Paid";

export const PAYMENT_FILTERS: PaymentFilter[] = ["All", "Unpaid", "Partial", "Paid"];

export type PurchaseAmountView = "Paid Amount" | "Remaining Amount";

export const PURCHASE_AMOUNT_VIEWS: PurchaseAmountView[] = [
  "Paid Amount",
  "Remaining Amount",
];
