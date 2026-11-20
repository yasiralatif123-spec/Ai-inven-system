import type { DateFilter, OrderStatus, PaymentFilter, PaymentStatus } from "./types";

export const PAYMENT_OPTIONS: Array<{ value: PaymentFilter; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "unpaid", label: "Unpaid" },
];

export const PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatus; label: string }> = [
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "unpaid", label: "Unpaid" },
];

export const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "Pending Approval", label: "Pending Approval" },
  { value: "Processing", label: "Processing" },
  { value: "Packed", label: "Packed" },
  { value: "Dispatched", label: "Dispatched" },
  { value: "Credit Hold", label: "Credit Hold" },
];

export const PAYMENT_METHODS = [
  "Cash",
  "Meezan IBFT",
  "1Link",
  "Bank Alfalah",
  "Cheque",
] as const;

export const HUB_OPTIONS = [
  "All Dispatch Hubs",
  "Lahore Central Depot",
  "Faisalabad Distribution Hub",
] as const;

export const DATE_OPTIONS: Array<{ value: DateFilter; label: string }> = [
  { value: "all", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "older", label: "Older Orders" },
];
