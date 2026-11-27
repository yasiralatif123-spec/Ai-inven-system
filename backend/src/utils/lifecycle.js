const SALE_STATUSES = [
  "Pending Approval",
  "Processing",
  "Packed",
  "Dispatched",
  "Delivered",
  "Credit Hold",
  "Cancelled",
];

const PURCHASE_STATUSES = [
  "Draft",
  "Ordered",
  "Partially Received",
  "Received",
  "Cancelled",
];

// Forward-only fulfillment progress. Skipping ahead (for example Pending
// Approval -> Delivered) is still allowed because existing clients use it.
const SALE_FLOW = [
  "Pending Approval",
  "Processing",
  "Packed",
  "Dispatched",
  "Delivered",
];

const PURCHASE_FLOW = ["Draft", "Ordered", "Partially Received", "Received"];

function isAllowedSaleTransition(from, to) {
  if (from === to) return true;
  if (!SALE_STATUSES.includes(from) || !SALE_STATUSES.includes(to)) return false;
  if (to === "Cancelled") return from !== "Cancelled";
  if (from === "Cancelled" || to === "Cancelled") return false;

  // A credit hold must be cleared back into the normal flow before advancing.
  if (from === "Credit Hold") return to === "Processing";
  if (to === "Credit Hold") {
    return from === "Pending Approval" || from === "Processing";
  }

  const fromIndex = SALE_FLOW.indexOf(from);
  const toIndex = SALE_FLOW.indexOf(to);
  return fromIndex >= 0 && toIndex > fromIndex;
}

function isAllowedPurchaseTransition(from, to) {
  if (from === to) return true;
  if (!PURCHASE_STATUSES.includes(from) || !PURCHASE_STATUSES.includes(to)) return false;
  if (to === "Cancelled") return from !== "Cancelled";
  if (from === "Cancelled" || to === "Cancelled") return false;

  const fromIndex = PURCHASE_FLOW.indexOf(from);
  const toIndex = PURCHASE_FLOW.indexOf(to);
  return fromIndex >= 0 && toIndex > fromIndex;
}

module.exports = {
  SALE_STATUSES,
  PURCHASE_STATUSES,
  isAllowedSaleTransition,
  isAllowedPurchaseTransition,
};
