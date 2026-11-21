import type { CreatePurchaseStatus } from "./types";

export const UNIT_OPTIONS = ["Carton", "Piece", "Box", "Dozen", "KG", "Litre"];

export const DEFAULT_TAX_RATE = 18;

export const PURCHASE_FORM_STATUSES: CreatePurchaseStatus[] = [
  "Draft",
  "Ordered",
  "Received",
];
