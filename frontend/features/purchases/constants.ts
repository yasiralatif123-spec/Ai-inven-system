import type { CreatePurchaseStatus } from "./types";

export const UNIT_OPTIONS = ["Carton", "Box", "Piece"];

export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Online Transfer"];

export const PURCHASE_FORM_STATUSES: CreatePurchaseStatus[] = [
  "Draft",
  "Ordered",
  "Received",
];
