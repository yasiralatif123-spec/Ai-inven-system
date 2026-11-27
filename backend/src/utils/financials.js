const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const SaleOrder = require("../models/SaleOrder");
const Purchase = require("../models/Purchase");
const { roundMoney } = require("./units");

// Kept in sync with supplier.controller.js so payable notes stay consistent.
const PAYMENT_TERMS_LABELS = {
  "net-15": "Net 15d",
  "net-30": "Net 30d",
  "net-7": "Net 7d",
  cod: "COD",
  advance: "Advance",
};

function nonNegativeMoney(value) {
  const rounded = roundMoney(value);
  return Number.isFinite(rounded) && rounded > 0 ? rounded : 0;
}

function toObjectId(value) {
  const id = String(value || "");
  return mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;
}

// JWT auth supplies businessId as a string. Aggregation $match does not cast
// strings to ObjectIds the way Model.find() does, so normalize it here or the
// ledger silently matches zero orders in tenant-enforced mode.
function tenantScope(businessId) {
  if (!businessId) return {};
  return { businessId: toObjectId(businessId) || businessId };
}

// A recomputation reads the ledger and then writes a denormalized summary.
// Serializing per party prevents two concurrent mutations from writing stale
// aggregate results over each other. This covers the single-process app; a
// multi-process deployment still needs a database-level coordination strategy.
const recalculationQueues = new Map();

function recalculationKey(type, businessId, id) {
  return `${type}:${businessId ? String(businessId) : "none"}:${String(id)}`;
}

function runSerialized(key, task) {
  const previous = recalculationQueues.get(key) || Promise.resolve();
  const result = previous.then(task, task);
  const settled = result.then(
    () => {},
    () => {}
  );
  recalculationQueues.set(key, settled);
  settled.then(() => {
    if (recalculationQueues.get(key) === settled) recalculationQueues.delete(key);
  });
  return result;
}

/**
 * Aggregate active sale orders by customer. Every query is scoped by businessId
 * when tenant enforcement is active, so a customer can never inherit totals
 * from another tenant's ledger.
 */
async function aggregateCustomerFinancials({
  customerIds = [],
  businessId = null,
  session = null,
} = {}) {
  const uniqueIds = [
    ...new Set(customerIds.map(toObjectId).filter(Boolean).map(String)),
  ];

  if (uniqueIds.length === 0) return new Map();

  const aggregate = SaleOrder.aggregate([
    {
      $match: {
        "customer.customerId": {
          $in: uniqueIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        status: { $ne: "Cancelled" },
        ...tenantScope(businessId),
      },
    },
    {
      $group: {
        _id: "$customer.customerId",
        orders: { $sum: 1 },
        totalPurchases: { $sum: { $ifNull: ["$financials.total", 0] } },
        orderOutstanding: { $sum: { $ifNull: ["$financials.outstanding", 0] } },
      },
    },
  ]);
  if (session) aggregate.session(session);

  const rows = await aggregate;
  return new Map(rows.map((row) => [String(row._id), row]));
}

function deriveCustomerFinancialSummary(customer, summary) {
  return {
    orders: Math.max(0, Number(summary?.orders) || 0),
    totalPurchases: nonNegativeMoney(summary?.totalPurchases),
    outstanding: nonNegativeMoney(
      nonNegativeMoney(customer?.openingBalance) + nonNegativeMoney(summary?.orderOutstanding)
    ),
  };
}

/**
 * Build customer responses whose money/count fields are derived from the live
 * sale ledger. Legacy records can keep stale denormalized values in the
 * database, but API consumers never receive them and no client-side order
 * query is trusted.
 */
async function withAuthoritativeCustomerFinancials(customers, { businessId = null } = {}) {
  const rows = (Array.isArray(customers) ? customers : []).map((customer) =>
    customer && typeof customer.toObject === "function" ? customer.toObject() : customer
  );
  const summaries = await aggregateCustomerFinancials({
    customerIds: rows.map((customer) => customer?._id),
    businessId,
  });

  return rows.map((customer) => ({
    ...customer,
    ...deriveCustomerFinancialSummary(customer, summaries.get(String(customer?._id))),
  }));
}

/**
 * Recompute a customer's stored financial summary from the authoritative sale
 * order ledger. Recomputing from scratch (instead of incrementing) makes every
 * call idempotent and automatically reverses edits, cancellations and deletes.
 */
async function recalculateCustomerFinancials({
  customerId,
  businessId = null,
  session = null,
} = {}) {
  const id = toObjectId(customerId);
  if (!id) return null;

  return runSerialized(recalculationKey("customer", businessId, id), async () => {
    const scope = tenantScope(businessId);
    const customerFilter = { _id: id, ...scope };

    const customerQuery = Customer.findOne(customerFilter);
    if (session) customerQuery.session(session);
    const customer = await customerQuery.lean();
    if (!customer) return null; // Never touch a customer outside this tenant.

    const summaries = await aggregateCustomerFinancials({
      customerIds: [id],
      businessId,
      session,
    });
    const financials = deriveCustomerFinancialSummary(customer, summaries.get(String(id)));

    const options = session ? { session } : {};
    await Customer.updateOne(customerFilter, { $set: financials }, options);

    return financials;
  });
}

/**
 * Recompute a supplier's stored financial summary from the authoritative
 * purchase ledger. Cancelled purchases are excluded, received quantities do
 * not affect money, and each purchase's remaining balance is clamped at zero
 * before being added to the opening balance.
 */
async function recalculateSupplierFinancials({
  supplierId,
  businessId = null,
  session = null,
} = {}) {
  if (!supplierId || !mongoose.isValidObjectId(String(supplierId))) return null;

  return runSerialized(recalculationKey("supplier", businessId, supplierId), async () => {
    const id = new mongoose.Types.ObjectId(String(supplierId));
    const scope = tenantScope(businessId);
    const supplierFilter = { _id: id, ...scope };

    const supplierQuery = Supplier.findOne(supplierFilter);
    if (session) supplierQuery.session(session);
    const supplier = await supplierQuery.lean();
    if (!supplier) return null; // Never touch a supplier outside this tenant.

    const purchaseFilter = {
      "supplier.id": String(id),
      status: { $ne: "Cancelled" },
      ...scope,
    };
    const aggregate = Purchase.aggregate([
      { $match: purchaseFilter },
      {
        $project: {
          total: { $ifNull: ["$financials.total", 0] },
          remaining: {
            $max: [
              {
                $subtract: [
                  { $ifNull: ["$financials.total", 0] },
                  { $ifNull: ["$paidAmount", 0] },
                ],
              },
              0,
            ],
          },
          purchaseDate: 1,
        },
      },
      {
        $group: {
          _id: null,
          purchaseOrders: { $sum: 1 },
          totalPurchases: { $sum: "$total" },
          remaining: { $sum: "$remaining" },
          lastPurchaseAt: { $max: "$purchaseDate" },
        },
      },
    ]);
    if (session) aggregate.session(session);
    const [summary] = await aggregate;

    const totalPurchases = nonNegativeMoney(summary?.totalPurchases);
    const outstanding = nonNegativeMoney(
      nonNegativeMoney(supplier.openingBalance) + nonNegativeMoney(summary?.remaining)
    );
    const payableNote =
      outstanding > 0
        ? PAYMENT_TERMS_LABELS[supplier.paymentTerms] || PAYMENT_TERMS_LABELS["net-30"]
        : "Cleared / Nil";
    const payableTone = outstanding > 0 ? "danger" : "success";
    const lastPurchaseAt = summary?.lastPurchaseAt ?? null;

    const options = session ? { session } : {};
    await Supplier.updateOne(
      supplierFilter,
      {
        $set: {
          totalPurchases,
          outstanding,
          payableNote,
          payableTone,
          lastPurchaseAt,
        },
      },
      options
    );

    return { totalPurchases, outstanding, lastPurchaseAt };
  });
}

module.exports = {
  aggregateCustomerFinancials,
  deriveCustomerFinancialSummary,
  recalculateCustomerFinancials,
  recalculateSupplierFinancials,
  withAuthoritativeCustomerFinancials,
};
