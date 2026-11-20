const mongoose = require("mongoose");
const SaleOrder = require("../models/SaleOrder");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const { runWithSession } = require("../utils/db");

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

function normalizeOptionalLabel(value, maxLength = 120) {
  const label = cleanString(value).replace(/\s+/g, " ");
  if (label.length > maxLength) {
    throw new ValidationError(`Flavor cannot exceed ${maxLength} characters`);
  }
  return label;
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const numeric = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : fallback;
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

async function findOrder(id, session = null) {
  if (mongoose.isValidObjectId(id)) {
    const byIdQuery = SaleOrder.findById(id);
    if (session) byIdQuery.session(session);
    const byId = await byIdQuery;
    if (byId) return byId;
  }
  const byNumberQuery = SaleOrder.findOne({ orderNumber: cleanString(id) });
  if (session) byNumberQuery.session(session);
  return byNumberQuery;
}

async function generateOrderNumber(session) {
  const query = SaleOrder.find({ orderNumber: /^SO-\d+$/ })
    .select("orderNumber")
    .lean();
  if (session) query.session(session);
  const orders = await query;
  const highest = orders.reduce((max, order) => {
    const value = Number(cleanString(order.orderNumber).replace("SO-", ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 8824);
  return `SO-${highest + 1}`;
}

async function findProductForItem(item, session = null) {
  const productId = cleanString(item?.productId);
  if (productId && mongoose.isValidObjectId(productId)) {
    const query = Product.findById(productId).select("sku title openingStock uom wholesalePrice flavors");
    if (session) query.session(session);
    return query.lean();
  }

  const sku = cleanString(item?.sku);
  if (!sku) return null;

  const query = Product.findOne({ sku }).select("sku title openingStock uom wholesalePrice flavors");
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
    totals.set(key, (totals.get(key) || 0) + Math.max(0, toNumber(item.quantity)));
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

async function buildOrderChanges(body, existingOrder = null, session = null) {
  const customer = body.customer;
  const customerName = cleanString(typeof customer === "string" ? customer : customer?.name);
  const phone = cleanString(typeof customer === "string" ? body.phone : customer?.phone ?? body.phone);
  const location = cleanString(
    typeof customer === "string" ? body.location : customer?.location ?? body.location
  );

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
    const submittedFlavor = normalizeOptionalLabel(rawItem?.flavor);

    if (!name || quantity <= 0 || unitPrice < 0) {
      throw new ValidationError(
        "Each item needs a name, a positive quantity, and a non-negative unit price"
      );
    }

    const previousItem = sku
      ? previousItems.find((candidate) => cleanString(candidate.sku) === sku)
      : null;
    const product = await findProductForItem(
      {
        sku,
        productId: cleanString(rawItem?.productId) || previousItem?.productId || null,
      },
      session
    );

    const effectiveUnitPrice =
      product && !existingOrder ? Math.max(toNumber(product.wholesalePrice), 0) : unitPrice;
    const canonicalFlavor =
      product?.flavors?.find(
        (candidate) => cleanString(candidate).toLowerCase() === submittedFlavor.toLowerCase()
      ) || submittedFlavor;

    items.push({
      name,
      sku,
      flavor: canonicalFlavor,
      productId: product?._id || null,
      quantity,
      unitLabel: cleanString(rawItem?.unitLabel) || "pcs",
      unitPrice: effectiveUnitPrice,
      available: product ? toNumber(product.openingStock) : 0,
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
    customer: { name: customerName, phone, location },
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
  mode = "update",
  session,
  compensations = [],
}) {
  const previousTotals = sumStockQuantities(previousItems, (item) => item.stockDeducted === true);
  const nextTotals = sumStockQuantities(nextItems, (item) => item.stockDeducted === true);
  const keys = new Set([...previousTotals.keys(), ...nextTotals.keys()]);
  const movements = [];

  for (const key of keys) {
    const delta = (nextTotals.get(key) || 0) - (previousTotals.get(key) || 0);
    if (delta === 0) continue;

    const representative =
      nextItems.find((item) => stockKey(item) === key) ||
      previousItems.find((item) => stockKey(item) === key);
    const product = await findProductForItem(representative, session);
    if (!product) {
      throw new ValidationError(
        `The product linked to ${representative?.name || key} no longer exists`
      );
    }

    const filter = { _id: product._id };
    if (delta > 0) filter.openingStock = { $gte: delta };

    const updated = await Product.findOneAndUpdate(
      filter,
      { $inc: { openingStock: -delta } },
      { new: true, runValidators: true, session }
    );

    if (!updated) {
      const current = await Product.findById(product._id).session(session).lean();
      const available = current ? toNumber(current.openingStock) : 0;
      throw new ValidationError(
        `Insufficient stock for ${representative.name}. Available: ${available}, requested: ${delta}`
      );
    }

    compensations.push(async () => {
      await Product.findByIdAndUpdate(product._id, { $inc: { openingStock: delta } }, { session });
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

    const [movement] = await StockMovement.create(
      [
        {
          product: product._id,
          sku: product.sku,
          productTitle: product.title,
          type: "sale",
          direction: delta > 0 ? "out" : "in",
          quantity: Math.abs(delta),
          previousStock: newStock + delta,
          newStock,
          unit: product.uom || representative.unitLabel || "",
          reason,
          reference: `${orderNumber} · SALE`,
          notes: `${mode === "delete" ? "Stock restored after sale order deletion" : "Stock synced from sale order"}`,
          performedBy,
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
      const changes = await buildOrderChanges(req.body || {}, null, session);
      const compensations = [];
      let created;

      try {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            const [document] = await SaleOrder.create(
              [
                {
                  orderNumber: await generateOrderNumber(session),
                  ...changes,
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
          mode: "create",
          session,
          compensations,
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
    const existing = await findOrder(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Sale order not found" });
    }

    const updated = await runWithSession(async (session, useTransaction) => {
      const order = await SaleOrder.findById(existing._id).session(session);
      if (!order) {
        throw new NotFoundError("Sale order not found");
      }

      const changes = await buildOrderChanges(req.body || {}, order, session);
      const compensations = [];

      try {
        await applyStockAdjustments({
          orderNumber: order.orderNumber,
          previousItems: order.items,
          nextItems: changes.items,
          performedBy: changes.createdBy,
          mode: "update",
          session,
          compensations,
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
    const orders = await SaleOrder.find().sort({ createdAt: -1 }).limit(200).lean();
    return res.status(200).json({ orders });
  } catch (error) {
    return next(error);
  }
}

async function updateSaleOrderStatus(req, res, next) {
  try {
    const order = await findOrder(req.params.id);
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
    const order = await findOrder(req.params.id);
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
    const existing = await findOrder(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Sale order not found" });
    }

    await runWithSession(async (session, useTransaction) => {
      const order = await SaleOrder.findById(existing._id).session(session);
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
          mode: "delete",
          session,
          compensations,
        });

        await SaleOrder.deleteOne({ _id: order._id }, { session });
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

module.exports = {
  createSaleOrder,
  updateSaleOrder,
  getSaleOrders,
  updateSaleOrderStatus,
  recordSaleOrderPayment,
  deleteSaleOrder,
};
