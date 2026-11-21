const mongoose = require("mongoose");
const SaleOrder = require("../models/SaleOrder");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const StockMovement = require("../models/StockMovement");
const { runWithSession } = require("../utils/db");
const {
  applyFlavorStockChange,
  uniqueFlavors,
} = require("../utils/flavor-stock");

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

function normalizeFlavorValues(value, allowedFlavors = []) {
  const raw = Array.isArray(value)
    ? value
    : value === undefined || value === null || value === ""
      ? []
      : [value];
  const allowed = Array.isArray(allowedFlavors) ? allowedFlavors : [];
  const result = [];

  for (const entry of raw) {
    for (const part of String(entry).split(/[\n,]/)) {
      const label = cleanString(part).replace(/\s+/g, " ");
      if (!label) continue;
      if (label.length > 120) {
        throw new ValidationError("Flavor cannot exceed 120 characters");
      }
      const canonical =
        allowed.find((candidate) => cleanString(candidate).toLowerCase() === label.toLowerCase()) ||
        label;
      if (!result.some((existing) => existing.toLowerCase() === canonical.toLowerCase())) {
        result.push(canonical);
      }
      if (result.length >= 24) return result;
    }
  }
  return result;
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const numeric = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function perFlavorPrice(product) {
  return Math.max(toNumber(product?.wholesalePrice), 0);
}

function sameFlavorSet(left = [], right = []) {
  const normalize = (values) =>
    (Array.isArray(values) ? values : [])
      .map((value) => cleanString(value).toLowerCase())
      .filter(Boolean)
      .sort();

  const first = normalize(left);
  const second = normalize(right);
  return (
    first.length === second.length && first.every((value, index) => value === second[index])
  );
}

async function resolveCustomer(body, session = null) {
  const customerInput = body?.customer;
  const customerIsObject = customerInput && typeof customerInput === "object";
  const explicitId = cleanString(
    body?.customerId ?? (customerIsObject ? customerInput.customerId : "")
  );

  if (explicitId && mongoose.isValidObjectId(explicitId)) {
    const byIdQuery = Customer.findById(explicitId)
      .select("_id name businessName phone")
      .lean();
    if (session) byIdQuery.session(session);
    const byId = await byIdQuery;
    if (byId) return byId;
  }

  const name = cleanString(
    customerIsObject ? customerInput.name : customerIsObject ? "" : customerInput
  );
  const phone = cleanString(
    customerIsObject ? customerInput.phone ?? body?.phone : body?.phone
  );

  const candidatesQuery = Customer.find().select("_id name businessName phone").lean();
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
    const quantity = Math.max(0, toNumber(item.quantity));
    const multiplier = uniqueFlavors(item.flavor).length || 1;
    totals.set(key, (totals.get(key) || 0) + quantity * multiplier);
  });

  return totals;
}

function sumFlavorQuantities(items, include) {
  const byProduct = new Map();

  (items || []).forEach((item) => {
    if (!include(item)) return;
    const key = stockKey(item);
    if (!key) return;
    const quantity = Math.max(0, toNumber(item.quantity));
    if (quantity === 0) return;

    const flavors = byProduct.get(key) || new Map();
    uniqueFlavors(item.flavor).forEach((flavor) => {
      flavors.set(flavor, (flavors.get(flavor) || 0) + quantity);
    });
    if (flavors.size > 0) byProduct.set(key, flavors);
  });

  return byProduct;
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
  const matchedCustomer = await resolveCustomer(body, session);

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

    const flavors = normalizeFlavorValues(rawItem?.flavor, product?.flavors);
    const productHasFlavors = Boolean(
      product && Array.isArray(product.flavors) && product.flavors.length > 0
    );

    if (productHasFlavors && flavors.length === 0) {
      throw new ValidationError(`Select at least one flavor for ${product.title}`);
    }

    const previousFlavors = previousItem
      ? normalizeFlavorValues(previousItem.flavor, product?.flavors)
      : [];
    const flavorsChanged = !previousItem || !sameFlavorSet(previousFlavors, flavors);
    const multiplier = productHasFlavors ? flavors.length : 1;
    const effectiveUnitPrice = product
      ? !existingOrder || flavorsChanged
        ? perFlavorPrice(product) * multiplier
        : Number(previousItem?.unitPrice) || unitPrice
      : unitPrice;

    items.push({
      name,
      sku,
      flavor: flavors,
      productId: product?._id || null,
      quantity,
      unitLabel: cleanString(rawItem?.unitLabel) || "pcs",
      basePrice: product
        ? !existingOrder || flavorsChanged
          ? perFlavorPrice(product)
          : Number(previousItem?.basePrice) || perFlavorPrice(product)
        : unitPrice,
      flavorCount: multiplier,
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
}) {
  const include = (item) => item.stockDeducted === true;
  const previousTotals = sumStockQuantities(previousItems, include);
  const nextTotals = sumStockQuantities(nextItems, include);
  const previousFlavorTotals = sumFlavorQuantities(previousItems, include);
  const nextFlavorTotals = sumFlavorQuantities(nextItems, include);
  const keys = new Set([
    ...previousTotals.keys(),
    ...nextTotals.keys(),
    ...previousFlavorTotals.keys(),
    ...nextFlavorTotals.keys(),
  ]);
  const movements = [];

  for (const key of keys) {
    const delta = (nextTotals.get(key) || 0) - (previousTotals.get(key) || 0);
    const previousFlavors = previousFlavorTotals.get(key) || new Map();
    const nextFlavors = nextFlavorTotals.get(key) || new Map();
    const flavorKeys = new Set([...previousFlavors.keys(), ...nextFlavors.keys()]);
    const flavorDeltas = [];

    for (const flavor of flavorKeys) {
      const flavorDelta = (nextFlavors.get(flavor) || 0) - (previousFlavors.get(flavor) || 0);
      if (flavorDelta !== 0) flavorDeltas.push({ flavor, delta: flavorDelta });
    }

    if (delta === 0 && flavorDeltas.length === 0) continue;

    const representative =
      nextItems.find((item) => stockKey(item) === key) ||
      previousItems.find((item) => stockKey(item) === key);
    const product = await findProductForItem(representative, session);
    if (!product) {
      throw new ValidationError(
        `The product linked to ${representative?.name || key} no longer exists`
      );
    }

    let newStock = toNumber(product.openingStock);
    if (delta !== 0) {
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

      newStock = toNumber(updated.openingStock);
    }

    for (const flavorDelta of flavorDeltas) {
      await applyFlavorStockChange({
        productId: product._id,
        flavor: flavorDelta.flavor,
        delta: -flavorDelta.delta,
        session,
        compensations,
      });
    }

    const reason =
      mode === "create"
        ? "Sale order placed"
        : mode === "delete"
          ? "Sale order deleted"
          : delta > 0
            ? "Sale order quantity increased"
            : delta < 0
              ? "Sale order quantity reduced"
              : "Sale flavor selection changed";

    const [movement] = await StockMovement.create(
      [
        {
          product: product._id,
          sku: product.sku,
          productTitle: product.title,
          type: "sale",
          direction: delta < 0 ? "in" : "out",
          quantity: Math.abs(delta) || 1,
          previousStock: newStock + delta,
          newStock,
          unit: product.uom || representative.unitLabel || "",
          reason,
          reference: `${orderNumber} · SALE`,
          notes: `${
            mode === "delete" ? "Stock restored after sale order deletion" : "Stock synced from sale order"
          }`,
          performedBy,
          partyName: cleanString(partyName),
          flavor: flavorDeltas.length === 1 ? flavorDeltas[0].flavor : "",
          flavorBreakdown: flavorDeltas.map(({ flavor, delta: flavorDelta }) => ({
            flavor,
            quantity: Math.abs(flavorDelta),
          })),
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
          partyName: created.customer?.name,
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
          partyName: changes.customer?.name || order.customer?.name,
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
    const customerId = cleanString(req.query?.customerId);
    if (customerId && !mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({ message: "Invalid customerId" });
    }

    const filter = customerId ? { "customer.customerId": customerId } : {};
    const orders = await SaleOrder.find(filter).sort({ createdAt: -1 }).limit(200).lean();
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
          partyName: order.customer?.name,
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
