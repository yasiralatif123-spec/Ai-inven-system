const mongoose = require("mongoose");
const SaleOrder = require("../models/SaleOrder");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const StockMovement = require("../models/StockMovement");
const { runWithSession } = require("../utils/db");
const { tenantFilter } = require("../utils/tenant");
const { normalizeUnit, toBasePieces, isSupportedUnit } = require("../utils/units");

function isTenantEnforced(req) {
  return req.tenantEnforced === true && Boolean(req.auth?.businessId);
}

function scopedFilter(req, extra = {}) {
  if (!isTenantEnforced(req)) return { ...extra };
  return tenantFilter(req, extra);
}

function tenantBusinessId(req) {
  return isTenantEnforced(req) ? req.auth.businessId : null;
}

const PAYMENT_STATUSES = ["paid", "partial", "unpaid"];
const ORDER_STATUSES = [
  "Pending Approval",
  "Processing",
  "Packed",
  "Dispatched",
  "Delivered",
  "Credit Hold",
];

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const numeric = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : fallback;
}

async function resolveCustomer(body, session = null, req = null) {
  const customerInput = body?.customer;
  const customerIsObject = customerInput && typeof customerInput === "object";
  const explicitId = cleanString(
    body?.customerId ?? (customerIsObject ? customerInput.customerId : "")
  );
  const scope = req ? scopedFilter(req) : {};

  if (explicitId && mongoose.isValidObjectId(explicitId)) {
    const byIdQuery = Customer.findOne({ ...scope, _id: explicitId })
      .select("_id name businessName phone")
      .lean();
    if (session) byIdQuery.session(session);
    const byId = await byIdQuery;
    if (byId) return byId;
    if (req && isTenantEnforced(req)) {
      throw new NotFoundError("The selected customer no longer exists");
    }
  }

  const name = cleanString(
    customerIsObject ? customerInput.name : customerIsObject ? "" : customerInput
  );
  const phone = cleanString(
    customerIsObject ? customerInput.phone ?? body?.phone : body?.phone
  );

  const candidatesQuery = Customer.find(scope).select("_id name businessName phone").lean();
  if (session) candidatesQuery.session(session);
  const candidates = await candidatesQuery;

  const phoneDigits = cleanString(phone).replace(/\D/g, "");
  if (phoneDigits.length >= 10) {
    const byPhone = candidates.find(
      (candidate) => cleanString(candidate.phone).replace(/\D/g, "") === phoneDigits
    );
    if (byPhone) return byPhone;
  }

  if (name) {
    const lowered = name.toLowerCase();
    const byName = candidates.find((candidate) =>
      [candidate.name, candidate.businessName]
        .filter(Boolean)
        .some((value) => cleanString(value).toLowerCase() === lowered)
    );
    if (byName) return byName;
  }

  return null;
}

function toWholeNumber(value, fallback = 0) {
  return Math.floor(toNumber(value, fallback));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function compactAmount(value) {
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`;
  }
  return String(value);
}

function buildPaymentLabel(paymentStatus, paid, method) {
  if (paymentStatus === "paid") return `Paid (${method || "Cash"})`;
  if (paymentStatus === "partial") return `Partial (${compactAmount(paid)})`;
  return "Unpaid (Due on receipt)";
}

async function findOrder(id, session = null, req = null) {
  const scope = req ? scopedFilter(req) : {};
  const key = cleanString(id);
  if (mongoose.isValidObjectId(key)) {
    const byIdQuery = SaleOrder.findOne({ ...scope, _id: key });
    if (session) byIdQuery.session(session);
    const byId = await byIdQuery;
    if (byId) return byId;
  }
  const byNumberQuery = SaleOrder.findOne({ ...scope, orderNumber: key });
  if (session) byNumberQuery.session(session);
  return byNumberQuery;
}

async function generateOrderNumber(session, req = null) {
  const filter = req ? scopedFilter(req, { orderNumber: /^SO-\d+$/ }) : { orderNumber: /^SO-\d+$/ };
  const query = SaleOrder.find(filter).select("orderNumber").lean();
  if (session) query.session(session);
  const orders = await query;
  const highest = orders.reduce((max, order) => {
    const value = Number(cleanString(order.orderNumber).replace("SO-", ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 8824);
  return `SO-${highest + 1}`;
}

async function findProductForItem(item, session = null, req = null) {
  const scope = req ? scopedFilter(req) : {};
  const productId = cleanString(item?.productId);
  if (productId && mongoose.isValidObjectId(productId)) {
    const query = Product.findOne({ ...scope, _id: productId }).select(
      "sku title openingStock uom wholesalePrice"
    );
    if (session) query.session(session);
    const byId = await query.lean();
    if (byId) return byId;
  }

  const sku = cleanString(item?.sku);
  if (!sku) return null;

  const query = Product.findOne({ ...scope, sku }).select(
    "sku title openingStock uom wholesalePrice"
  );
  if (session) query.session(session);
  return query.lean();
}

function stockKey(item) {
  const sku = cleanString(item?.sku);
  if (sku) return `sku:${sku.toLowerCase()}`;

  const productId = cleanString(item?.productId);
  if (productId && mongoose.isValidObjectId(productId)) {
    return `id:${productId.toLowerCase()}`;
  }
  return "";
}

function sumStockQuantities(items, include) {
  const totals = new Map();

  (items || []).forEach((item) => {
    if (!include(item)) return;
    const key = stockKey(item);
    if (!key) return;
    const baseQuantity = Math.max(
      0,
      Number(item.baseQuantity) ||
        toBasePieces(item.quantity, normalizeUnit(item.unitLabel) || "Piece") ||
        toNumber(item.quantity)
    );
    totals.set(key, (totals.get(key) || 0) + baseQuantity);
  });

  return totals;
}

async function rollbackCompensations(compensations) {
  for (const compensate of [...compensations].reverse()) {
    try {
      await compensate();
    } catch (error) {
      console.error("Failed to roll back sale stock change:", error.message);
    }
  }
}

async function buildOrderChanges(body, existingOrder = null, session = null, req = null) {
  const customer = body.customer;
  const customerName = cleanString(typeof customer === "string" ? customer : customer?.name);
  const phone = cleanString(typeof customer === "string" ? body.phone : customer?.phone ?? body.phone);
  const location = cleanString(
    typeof customer === "string" ? body.location : customer?.location ?? body.location
  );
  const matchedCustomer = await resolveCustomer(body, session, req);

  if (!customerName) {
    throw new ValidationError("Customer name is required");
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new ValidationError("At least one order item is required");
  }

  const paymentStatus = cleanString(body.paymentStatus) || "unpaid";
  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new ValidationError("Invalid payment status");
  }

  const status = cleanString(body.status) || existingOrder?.status || "Pending Approval";
  if (!ORDER_STATUSES.includes(status)) {
    throw new ValidationError("Invalid order status");
  }

  const previousItems = existingOrder?.items || [];
  const items = [];
  for (const rawItem of body.items) {
    const name = cleanString(rawItem?.name);
    const sku = cleanString(rawItem?.sku);
    const quantity = toWholeNumber(rawItem?.quantity);
    const unitPrice = toNumber(rawItem?.unitPrice);
    const rawUnit = cleanString(rawItem?.unitLabel) || cleanString(rawItem?.unit) || "Piece";
    const unitLabel = normalizeUnit(rawUnit);

    if (!name || quantity <= 0 || unitPrice < 0) {
      throw new ValidationError(
        "Each item needs a name, a positive quantity, and a non-negative unit price"
      );
    }
    if (!unitLabel || !isSupportedUnit(unitLabel)) {
      throw new ValidationError(
        `Item ${name || sku || "line item"} has an invalid unit. Use Carton, Box, or Piece`
      );
    }
    const baseQuantity = toBasePieces(quantity, unitLabel);
    if (!Number.isFinite(baseQuantity) || baseQuantity <= 0) {
      throw new ValidationError(`Item ${name || sku || "line item"} has an invalid quantity/unit conversion`);
    }

    const previousItem = sku
      ? previousItems.find((candidate) => cleanString(candidate.sku) === sku)
      : null;
    const requestedProductId = cleanString(rawItem?.productId) || previousItem?.productId || null;
    const product = await findProductForItem(
      {
        sku,
        productId: requestedProductId,
      },
      session,
      req
    );

    if ((requestedProductId || sku) && !product) {
      throw new ValidationError(
        `The product linked to ${name} was not found in this business`
      );
    }

    const basePrice = product ? Math.max(toNumber(product.wholesalePrice), 0) : unitPrice;
    const effectiveUnitPrice = product
      ? existingOrder && previousItem
        ? Number(previousItem.unitPrice) || basePrice
        : basePrice
      : unitPrice;

    items.push({
      name,
      sku,
      productId: product?._id || null,
      quantity,
      baseQuantity,
      unitLabel,
      basePrice,
      unitPrice: effectiveUnitPrice,
      available: product ? Math.max(0, toNumber(product.openingStock)) : 0,
      stockDeducted: Boolean(product),
      lineTotal: quantity * effectiveUnitPrice,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (subtotal <= 0) {
    throw new ValidationError("Order subtotal must be greater than zero");
  }

  const discount = clamp(toNumber(body.discount), 0, subtotal);
  const freight = Math.max(toNumber(body.freight), 0);
  const tax = Math.round(((subtotal - discount) * 18) / 118);
  const total = subtotal - discount + freight;

  let paid = 0;
  if (paymentStatus === "paid") {
    paid = total;
  } else if (paymentStatus === "partial") {
    paid = clamp(toNumber(body.amountReceived), 0, total);
    if (paid <= 0) {
      throw new ValidationError("amountReceived is required for partial payments");
    }
  }

  const outstanding = Math.max(total - paid, 0);
  const paymentMethod = cleanString(body.paymentMethod) || "Cash";
  const paymentLabel = buildPaymentLabel(paymentStatus, paid, paymentMethod);
  const dueDate = outstanding > 0 ? "Due on receipt" : "Settled in full";

  return {
    customer: {
      customerId: matchedCustomer?._id || null,
      name: customerName,
      phone,
      location,
    },
    hub: cleanString(body.hub),
    paymentStatus,
    paymentLabel,
    paymentMethod,
    status,
    createdBy: cleanString(body.createdBy) || cleanString(existingOrder?.createdBy) || "Tariq M. (Owner)",
    bay: cleanString(body.bay) || "Counter",
    items,
    skuCount: items.length,
    unitCount: items.reduce((sum, item) => sum + item.quantity, 0),
    amount: total,
    financials: {
      subtotal,
      discount,
      tax,
      freight,
      total,
      paid,
      outstanding,
      dueDate,
    },
  };
}

/**
 * Applies the stock difference between an order's previous and next item sets.
 * A positive delta deducts stock and a negative delta restores it. Each change
 * writes an immutable StockMovement record referencing the sale order.
 */
async function applyStockAdjustments({
  orderNumber,
  previousItems = [],
  nextItems = [],
  performedBy = "Tariq M. (Owner)",
  partyName = "",
  mode = "update",
  session,
  compensations = [],
  req = null,
}) {
  const include = (item) => item.stockDeducted === true;
  const previousTotals = sumStockQuantities(previousItems, include);
  const nextTotals = sumStockQuantities(nextItems, include);
  const keys = new Set([...previousTotals.keys(), ...nextTotals.keys()]);
  const movements = [];

  for (const key of keys) {
    const delta = (nextTotals.get(key) || 0) - (previousTotals.get(key) || 0);
    if (delta === 0) continue;

    const representative =
      nextItems.find((item) => stockKey(item) === key) ||
      previousItems.find((item) => stockKey(item) === key);
    const product = await findProductForItem(representative, session, req);
    if (!product) {
      throw new ValidationError(
        `The product linked to ${representative?.name || key} no longer exists`
      );
    }

    const biz = tenantBusinessId(req);
    const filter = biz ? { _id: product._id, businessId: biz } : { _id: product._id };
    if (delta > 0) filter.openingStock = { $gte: delta };

    const updated = await Product.findOneAndUpdate(
      filter,
      { $inc: { openingStock: -delta } },
      { new: true, runValidators: true, session }
    );

    if (!updated) {
      const current = await Product.findOne(
        biz ? { _id: product._id, businessId: biz } : { _id: product._id }
      )
        .session(session)
        .lean();
      const available = current ? toNumber(current.openingStock) : 0;
      throw new ValidationError(
        `Insufficient stock for ${representative.name}. Available: ${available}, requested: ${delta}`
      );
    }

    compensations.push(async () => {
      await Product.findOneAndUpdate(
        biz ? { _id: product._id, businessId: biz } : { _id: product._id },
        { $inc: { openingStock: delta } },
        { session }
      );
    });

    const newStock = toNumber(updated.openingStock);
    const reason =
      mode === "create"
        ? "Sale order placed"
        : mode === "delete"
          ? "Sale order deleted"
          : delta > 0
            ? "Sale order quantity increased"
            : "Sale order quantity reduced";

    const absDelta = Math.abs(delta);
    const repUnit = normalizeUnit(representative?.unitLabel) || "Piece";
    const factor = toBasePieces(1, repUnit) || 1;
    const originalQty = factor > 0 && absDelta % factor === 0 ? absDelta / factor : absDelta;
    const originalUnit = factor > 0 && absDelta % factor === 0 ? repUnit : "Piece";

    const [movement] = await StockMovement.create(
      [
        {
          product: product._id,
          sku: product.sku,
          productTitle: product.title,
          type: "sale",
          direction: delta < 0 ? "in" : "out",
          quantity: absDelta,
          originalQuantity: originalQty,
          originalUnit,
          baseQuantity: absDelta,
          previousStock: newStock + delta,
          newStock,
          unit: originalUnit,
          reason,
          reference: `${orderNumber} - SALE`,
          notes:
            mode === "delete"
              ? "Stock restored after sale order deletion"
              : "Stock synced from sale order",
          performedBy,
          partyName: cleanString(partyName),
          ...(biz ? { businessId: biz, createdByUserId: req?.auth?.id || null } : {}),
        },
      ],
      { session }
    );

    movements.push(movement);
    compensations.push(async () => {
      await StockMovement.deleteOne({ _id: movement._id }, { session });
    });
  }

  return movements;
}

function handleControllerError(error, res, next) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ message: error.message });
  }
  if (error instanceof ConflictError) {
    return res.status(409).json({ message: error.message });
  }
  if (error instanceof NotFoundError) {
    return res.status(404).json({ message: error.message });
  }
  return next(error);
}

async function createSaleOrder(req, res, next) {
  try {
    const order = await runWithSession(async (session, useTransaction) => {
      const changes = await buildOrderChanges(req.body || {}, null, session, req);
      const compensations = [];
      let created;

      try {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            const [document] = await SaleOrder.create(
              [
                {
                  orderNumber: await generateOrderNumber(session, req),
                  ...changes,
                  ...(tenantBusinessId(req) ? { businessId: tenantBusinessId(req), createdByUserId: req.auth.id } : {}),
                },
              ],
              { session }
            );
            created = document;
            break;
          } catch (error) {
            if (error?.code === 11000 && attempt < 4) continue;
            throw error;
          }
        }

        await applyStockAdjustments({
          orderNumber: created.orderNumber,
          previousItems: [],
          nextItems: created.items,
          performedBy: created.createdBy,
          partyName: created.customer?.name,
          mode: "create",
          session,
          compensations,
          req,
        });

        return created;
      } catch (error) {
        if (!useTransaction) {
          await rollbackCompensations(compensations);
          if (created) {
            await SaleOrder.deleteOne({ _id: created._id }, { session }).catch(() => {});
          }
        }
        throw error;
      }
    });

    return res.status(201).json({ message: "Sale order created", order });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function updateSaleOrder(req, res, next) {
  try {
    const existing = await findOrder(req.params.id, null, req);
    if (!existing) {
      return res.status(404).json({ message: "Sale order not found" });
    }

    const updated = await runWithSession(async (session, useTransaction) => {
      const order = await SaleOrder.findOne(scopedFilter(req, { _id: existing._id })).session(session);
      if (!order) {
        throw new NotFoundError("Sale order not found");
      }

      const changes = await buildOrderChanges(req.body || {}, order, session, req);
      const compensations = [];

      try {
        await applyStockAdjustments({
          orderNumber: order.orderNumber,
          previousItems: order.items,
          nextItems: changes.items,
          performedBy: changes.createdBy,
          partyName: changes.customer?.name || order.customer?.name,
          mode: "update",
          session,
          compensations,
          req,
        });

        Object.assign(order, changes);
        await order.save({ session });
        return order;
      } catch (error) {
        if (!useTransaction) await rollbackCompensations(compensations);
        throw error;
      }
    });

    return res.status(200).json({ message: "Sale order updated", order: updated });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function getSaleOrders(req, res, next) {
  try {
    const customerId = cleanString(req.query?.customerId);
    if (customerId && !mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({ message: "Invalid customerId" });
    }

    const filter = scopedFilter(req, customerId ? { "customer.customerId": customerId } : {});
    const orders = await SaleOrder.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    return res.status(200).json({ orders });
  } catch (error) {
    return next(error);
  }
}

async function updateSaleOrderStatus(req, res, next) {
  try {
    const order = await findOrder(req.params.id, null, req);
    if (!order) {
      return res.status(404).json({ message: "Sale order not found" });
    }

    const status = cleanString(req.body?.status);
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    order.status = status;
    await order.save();
    return res.status(200).json({ message: "Sale order status updated", order });
  } catch (error) {
    return next(error);
  }
}

async function recordSaleOrderPayment(req, res, next) {
  try {
    const order = await findOrder(req.params.id, null, req);
    if (!order) {
      return res.status(404).json({ message: "Sale order not found" });
    }

    const amount = toNumber(req.body?.amount);
    if (amount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than zero" });
    }
    if (amount > order.financials.outstanding) {
      return res.status(400).json({
        message: `Payment cannot exceed the outstanding balance (${order.financials.outstanding})`,
      });
    }

    const method = cleanString(req.body?.method) || order.paymentMethod || "Cash";
    const paid = order.financials.paid + amount;
    const outstanding = Math.max(order.financials.total - paid, 0);
    const paymentStatus = outstanding === 0 ? "paid" : "partial";

    order.financials.paid = paid;
    order.financials.outstanding = outstanding;
    order.financials.dueDate = outstanding === 0 ? "Settled in full" : order.financials.dueDate;
    order.paymentStatus = paymentStatus;
    order.paymentMethod = method;
    order.paymentLabel = buildPaymentLabel(paymentStatus, paid, method);

    await order.save();
    return res.status(200).json({ message: "Payment recorded", order });
  } catch (error) {
    return next(error);
  }
}

async function deleteSaleOrder(req, res, next) {
  try {
    const existing = await findOrder(req.params.id, null, req);
    if (!existing) {
      return res.status(404).json({ message: "Sale order not found" });
    }

    await runWithSession(async (session, useTransaction) => {
      const order = await SaleOrder.findOne(scopedFilter(req, { _id: existing._id })).session(session);
      if (!order) {
        throw new NotFoundError("Sale order not found");
      }

      const compensations = [];
      try {
        await applyStockAdjustments({
          orderNumber: order.orderNumber,
          previousItems: order.items,
          nextItems: [],
          performedBy: order.createdBy,
          partyName: order.customer?.name,
          mode: "delete",
          session,
          compensations,
        });

        await SaleOrder.deleteOne(scopedFilter(req, { _id: order._id }), { session });
      } catch (error) {
        if (!useTransaction) await rollbackCompensations(compensations);
        throw error;
      }
    });

    return res.status(200).json({ message: "Sale order deleted" });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function getSaleOrderById(req, res, next) {
  try {
    const order = await findOrder(req.params.id, null, req);
    if (!order) {
      return res.status(404).json({ message: "Sale order not found" });
    }
    return res.status(200).json({ order });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function getSaleOrderByNumber(req, res, next) {
  try {
    const orderNumber = cleanString(req.params.orderNumber);
    if (!orderNumber) {
      return res.status(400).json({ message: "orderNumber is required" });
    }
    const order = await SaleOrder.findOne(scopedFilter(req, { orderNumber })).lean();
    if (!order) {
      return res.status(404).json({ message: "Sale order not found" });
    }
    return res.status(200).json({ order });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

module.exports = {
  createSaleOrder,
  updateSaleOrder,
  getSaleOrders,
  getSaleOrderById,
  getSaleOrderByNumber,
  updateSaleOrderStatus,
  recordSaleOrderPayment,
  deleteSaleOrder,
};
