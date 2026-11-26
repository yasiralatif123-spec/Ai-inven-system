const mongoose = require("mongoose");
const SaleOrder = require("../models/SaleOrder");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const StockMovement = require("../models/StockMovement");
const { runWithSession } = require("../utils/db");
const { recalculateCustomerFinancials } = require("../utils/financials");
const {
  buildLegacyBalancePayment,
  buildPaymentRecord,
  createIdempotencyKey,
  deriveSalePaymentState,
  findPaymentByKey,
  ledgerPaid,
  parsePaymentAmount,
  plainPayments,
  resolveIdempotencyKey,
  sumPayments,
} = require("../utils/payment-accounting");
const { tenantFilter } = require("../utils/tenant");
const { resolveActorName, DEFAULT_ACTOR_NAME } = require("../utils/actor");
const {
  normalizeUnit,
  toBasePieces,
  isSupportedUnit,
  priceForUnit,
  parseMoneyInput,
  parseStoredMoney,
  roundMoney,
} = require("../utils/units");

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

function customerIdOf(order) {
  const id = order?.customer?.customerId;
  return id ? String(id) : null;
}

async function refreshCustomerFinancials(ids, req, session = null) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  for (const customerId of uniqueIds) {
    await recalculateCustomerFinancials({
      customerId,
      businessId: tenantBusinessId(req),
      session,
    });
  }
}

const PAYMENT_STATUSES = ["paid", "partial", "unpaid"];
const ORDER_STATUSES = [
  "Pending Approval",
  "Processing",
  "Packed",
  "Dispatched",
  "Delivered",
  "Credit Hold",
  "Cancelled",
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

function requireMoney(value, label) {
  const amount = parseMoneyInput(value);
  if (amount === null) {
    throw new ValidationError(`${label} must be a finite, non-negative number`);
  }
  return amount;
}

function sameCatalogSnapshot(previousItem, product, requestedProductId, sku) {
  if (!previousItem) return false;
  const previousId = cleanString(previousItem.productId).toLowerCase();
  const currentId = cleanString(product?._id || requestedProductId).toLowerCase();
  if (previousId && currentId) return previousId === currentId;

  const previousSku = cleanString(previousItem.sku).toLowerCase();
  const currentSku = cleanString(sku).toLowerCase();
  return Boolean(previousSku && currentSku && previousSku === currentSku);
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

  const requestedPaymentStatus = cleanString(body.paymentStatus) || "unpaid";
  if (!PAYMENT_STATUSES.includes(requestedPaymentStatus)) {
    throw new ValidationError("Invalid payment status");
  }

  const status = cleanString(body.status) || existingOrder?.status || "Pending Approval";
  if (!ORDER_STATUSES.includes(status)) {
    throw new ValidationError("Invalid order status");
  }
  // Cancellation is a lifecycle action, never a field set by create/edit forms.
  // PATCH /:id/status is the only endpoint allowed to assign it.
  if (status === "Cancelled") {
    throw new ValidationError("Use the Cancel action to cancel a sale order");
  }

  const previousItems = existingOrder?.items || [];
  const items = [];
  for (const rawItem of body.items) {
    const name = cleanString(rawItem?.name);
    const sku = cleanString(rawItem?.sku);
    const quantity = toWholeNumber(rawItem?.quantity);
    const unitPrice = requireMoney(rawItem?.unitPrice, `Item ${name || sku || "line item"} unit price`);
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

    const requestedItemId = cleanString(rawItem?.productId).toLowerCase();
    const previousItem = previousItems.find((candidate) => {
      const previousSku = cleanString(candidate.sku).toLowerCase();
      const previousId = cleanString(candidate.productId).toLowerCase();
      return (Boolean(sku) && previousSku === sku.toLowerCase()) ||
        (Boolean(requestedItemId) && previousId === requestedItemId);
    }) || null;
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

    const catalogBasePrice = product
      ? requireMoney(product.wholesalePrice, `Catalog price for ${product.title}`)
      : null;
    const catalogUnitPrice = catalogBasePrice === null
      ? null
      : priceForUnit(catalogBasePrice, unitLabel);
    const keepSnapshot = Boolean(
      product &&
        previousItem &&
        cleanString(previousItem.priceBasis) !== "manual" &&
        sameCatalogSnapshot(previousItem, product, requestedProductId, sku) &&
        normalizeUnit(previousItem.unitLabel) === unitLabel
    );
    const savedBasePrice = keepSnapshot ? parseStoredMoney(previousItem.basePrice) : null;
    const savedUnitPrice = keepSnapshot ? parseStoredMoney(previousItem.unitPrice) : null;
    const basePrice = product
      ? savedBasePrice !== null
        ? savedBasePrice
        : catalogBasePrice ?? 0
      : unitPrice;
    const effectiveUnitPrice = product
      ? savedUnitPrice !== null
        ? savedUnitPrice
        : catalogUnitPrice ?? 0
      : unitPrice;

    items.push({
      name,
      sku,
      productId: product?._id || null,
      quantity,
      baseQuantity,
      unitLabel,
      priceBasis: product ? "catalog" : "manual",
      basePrice,
      unitPrice: effectiveUnitPrice,
      available: product ? Math.max(0, toNumber(product.openingStock)) : 0,
      stockDeducted: Boolean(product),
      lineTotal: roundMoney(quantity * effectiveUnitPrice),
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (subtotal <= 0) {
    throw new ValidationError("Order subtotal must be greater than zero");
  }

  const discount = clamp(requireMoney(body.discount, "Discount"), 0, subtotal);
  const freight = requireMoney(body.freight, "Freight");
  const tax = Math.round(((subtotal - discount) * 18) / 118);
  const total = subtotal - discount + freight;

  let requestedPaid = 0;
  if (requestedPaymentStatus === "paid") {
    requestedPaid = total;
  } else if (requestedPaymentStatus === "partial") {
    requestedPaid = clamp(requireMoney(body.amountReceived, "Amount received"), 0, total);
    if (requestedPaid <= 0) {
      throw new ValidationError("amountReceived is required for partial payments");
    }
  }

  const paymentMethod = cleanString(body.paymentMethod) || "Cash";
  const paymentReference = cleanString(body.paymentReference);
  const existingPayments = plainPayments(existingOrder);
  const recordedPaid = existingOrder
    ? existingPayments.length > 0
      ? sumPayments(existingPayments)
      : Number(existingOrder.financials?.paid) || 0
    : 0;

  let payments = existingPayments;
  let paid = recordedPaid;
  if (!existingOrder) {
    if (requestedPaid > 0) {
      payments = [
        buildPaymentRecord({
          amount: requestedPaid,
          method: paymentMethod,
          reference: paymentReference,
          idempotencyKey: createIdempotencyKey("sale_initial"),
          createdBy: resolveActorName(req),
        }),
      ];
      paid = requestedPaid;
    }
  } else {
    if (requestedPaid < recordedPaid) {
      throw new ValidationError(
        "Paid amount cannot be reduced through sale edit; payment history is immutable"
      );
    }
    if (requestedPaid > recordedPaid) {
      payments = [
        ...existingPayments,
        buildPaymentRecord({
          amount: requestedPaid - recordedPaid,
          method: paymentMethod,
          reference: paymentReference,
          idempotencyKey: createIdempotencyKey("sale_edit"),
          createdBy: resolveActorName(req),
        }),
      ];
      paid = requestedPaid;
    }
  }

  paid = Math.round((paid + Number.EPSILON) * 100) / 100;
  if (paid > total) {
    throw new ValidationError(
      `Recorded payments (${paid}) cannot exceed the sale total (${total}); reduce the total is not supported`
    );
  }

  const paymentState = deriveSalePaymentState({
    total,
    paid,
    method: paymentMethod,
    dueDate: existingOrder?.financials?.dueDate,
  });
  const { outstanding, paymentStatus, paymentLabel, dueDate } = paymentState;

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
    payments,
    status,
    createdBy: cleanString(existingOrder?.createdBy) || resolveActorName(req),
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
  performedBy = DEFAULT_ACTOR_NAME,
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
      const customerIds = [];
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

        const customerId = customerIdOf(created);
        if (customerId) {
          customerIds.push(customerId);
          await recalculateCustomerFinancials({
            customerId,
            businessId: tenantBusinessId(req),
            session,
          });
        }

        return created;
      } catch (error) {
        if (!useTransaction) {
          await rollbackCompensations(compensations);
          if (created) {
            await SaleOrder.deleteOne({ _id: created._id }, { session }).catch(() => {});
          }
          await refreshCustomerFinancials(customerIds, req, session).catch(() => {});
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
    if (existing.status === "Cancelled") {
      throw new ValidationError("Cancelled sales orders cannot be edited");
    }

    const updated = await runWithSession(async (session, useTransaction) => {
      const order = await SaleOrder.findOne(scopedFilter(req, { _id: existing._id })).session(session);
      if (!order) {
        throw new NotFoundError("Sale order not found");
      }
      if (order.status === "Cancelled") {
        throw new ValidationError("Cancelled sales orders cannot be edited");
      }

      const changes = await buildOrderChanges(req.body || {}, order, session, req);
      if (changes.status === "Cancelled" && order.status !== "Cancelled") {
        throw new ValidationError("Use the Cancel action to cancel a sale order");
      }
      const previousCustomerId = customerIdOf(order);
      const customerIds = [previousCustomerId, customerIdOf(changes)];
      const compensations = [];
      const expectedVersion = Number(order.__v) || 0;
      let documentUpdated = false;
      const previousState = order.toObject();
      delete previousState._id;
      delete previousState.__v;
      delete previousState.createdAt;
      delete previousState.updatedAt;

      try {
        await applyStockAdjustments({
          orderNumber: order.orderNumber,
          previousItems: order.items,
          nextItems: changes.items,
          performedBy: resolveActorName(req),
          partyName: changes.customer?.name || order.customer?.name,
          mode: "update",
          session,
          compensations,
          req,
        });

        const saved = await SaleOrder.findOneAndUpdate(
          scopedFilter(req, { _id: order._id, __v: expectedVersion }),
          { $set: changes, $inc: { __v: 1 } },
          { new: true, runValidators: true, session }
        );
        if (!saved) {
          throw new ConflictError("This sale order changed while it was being edited");
        }
        documentUpdated = true;

        await refreshCustomerFinancials(customerIds, req, session);
        return saved;
      } catch (error) {
        if (!useTransaction) {
          await rollbackCompensations(compensations);
          if (documentUpdated) {
            await SaleOrder.updateOne(
              scopedFilter(req, { _id: order._id, __v: expectedVersion + 1 }),
              { $set: previousState },
              { session }
            ).catch(() => {});
          }
          await refreshCustomerFinancials(customerIds, req, session).catch(() => {});
        }
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
    const existing = await findOrder(req.params.id, null, req);
    if (!existing) {
      return res.status(404).json({ message: "Sale order not found" });
    }

    const status = cleanString(req.body?.status);
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    if (existing.status === "Cancelled" && status !== "Cancelled") {
      return res.status(400).json({ message: "Cancelled sales orders cannot be reactivated" });
    }

    if (status === "Cancelled" && existing.status !== "Cancelled") {
      const updated = await runWithSession(async (session, useTransaction) => {
        const order = await SaleOrder.findOne(scopedFilter(req, { _id: existing._id })).session(session);
        if (!order) {
          throw new NotFoundError("Sale order not found");
        }
        if (order.status === "Cancelled") return order;

        const compensations = [];
        try {
          // If delivered, goods already reached customer - do not restock inventory.
          if (order.status !== "Delivered") {
            await applyStockAdjustments({
              orderNumber: order.orderNumber,
              previousItems: order.items,
              nextItems: [],
              performedBy: resolveActorName(req),
              partyName: order.customer?.name,
              mode: "update",
              session,
              compensations,
              req,
            });
          }

          // Prevent future delete/edit from double-restocking cancelled orders.
          order.items = (order.items || []).map((item) => {
            const plain = typeof item.toObject === "function" ? item.toObject() : { ...item };
            return { ...plain, stockDeducted: false };
          });
          order.status = "Cancelled";
          await order.save({ session });
          await refreshCustomerFinancials([customerIdOf(order)], req, session);
          return order;
        } catch (error) {
          if (!useTransaction) {
            await rollbackCompensations(compensations);
            await refreshCustomerFinancials([customerIdOf(order)], req, session).catch(() => {});
          }
          throw error;
        }
      });

      return res.status(200).json({ message: "Sale order cancelled", order: updated });
    }

    const updated = await runWithSession(async (session, useTransaction) => {
      const order = await SaleOrder.findOne(scopedFilter(req, { _id: existing._id })).session(session);
      if (!order) {
        throw new NotFoundError("Sale order not found");
      }

      const customerIds = [customerIdOf(order)];
      const previousStatus = order.status;
      try {
        order.status = status;
        await order.save({ session });
        await refreshCustomerFinancials(customerIds, req, session);
        return order;
      } catch (error) {
        if (!useTransaction) {
          await SaleOrder.updateOne(
            scopedFilter(req, { _id: order._id }),
            { $set: { status: previousStatus } },
            { session }
          );
          await refreshCustomerFinancials(customerIds, req, session).catch(() => {});
        }
        throw error;
      }
    });

    return res.status(200).json({ message: "Sale order status updated", order: updated });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function recordSaleOrderPayment(req, res, next) {
  try {
    const order = await findOrder(req.params.id, null, req);
    if (!order) {
      return res.status(404).json({ message: "Sale order not found" });
    }
    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Payments cannot be recorded against a cancelled sale order" });
    }

    let amount;
    let idempotencyKey;
    try {
      amount = parsePaymentAmount(req.body?.amount);
      idempotencyKey = resolveIdempotencyKey(req, {
        kind: "sale",
        documentId: order._id,
        amount,
      });
    } catch (error) {
      throw new ValidationError(error.message);
    }

    const updated = await runWithSession(async (session, useTransaction) => {
      const customerIds = [customerIdOf(order)];

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const current = await SaleOrder.findOne(scopedFilter(req, { _id: order._id })).session(session);
        if (!current) {
          throw new NotFoundError("Sale order not found");
        }
        if (current.status === "Cancelled") {
          throw new ValidationError("Payments cannot be recorded against a cancelled sale order");
        }

        const replay = findPaymentByKey(current, idempotencyKey);
        if (replay) {
          if (roundMoney(replay.amount) !== amount) {
            throw new ConflictError("This idempotency key was already used for a different payment");
          }
          await refreshCustomerFinancials([customerIdOf(current)], req, session);
          return current;
        }

        const total = roundMoney(Number(current.financials?.total) || 0);
        const recordedPaid = ledgerPaid(current, current.financials?.paid);
        const outstanding = roundMoney(Math.max(total - recordedPaid, 0));
        if (amount > outstanding) {
          throw new ValidationError(`Payment cannot exceed the outstanding balance (${outstanding})`);
        }

        const method = cleanString(req.body?.method) || current.paymentMethod || "Cash";
        const reference = cleanString(req.body?.reference);
        const actor = resolveActorName(req);
        const records = [];

        if (plainPayments(current).length === 0 && recordedPaid > 0) {
          const baseline = buildLegacyBalancePayment({
            paid: recordedPaid,
            documentId: current._id,
            method: current.paymentMethod || method,
            reference: "Legacy paid balance migrated on first recorded payment",
            paidAt: current.createdAt || new Date(),
            createdBy: current.createdBy || actor,
          });
          if (baseline) records.push(baseline);
        }

        records.push(
          buildPaymentRecord({
            amount,
            method,
            reference,
            idempotencyKey,
            createdBy: actor,
          })
        );

        const nextPaid = roundMoney(recordedPaid + amount);
        const paymentState = deriveSalePaymentState({
          total,
          paid: nextPaid,
          method,
          dueDate: current.financials?.dueDate,
        });
        const currentFinancials =
          typeof current.financials?.toObject === "function"
            ? current.financials.toObject()
            : { ...current.financials };
        const nextFinancials = {
          ...currentFinancials,
          paid: paymentState.paid,
          outstanding: paymentState.outstanding,
          dueDate: paymentState.dueDate,
        };
        const expectedVersion = Number(current.__v) || 0;
        const previousState = current.toObject();
        delete previousState._id;
        delete previousState.__v;
        delete previousState.createdAt;
        delete previousState.updatedAt;

        const writeResult = await SaleOrder.updateOne(
          scopedFilter(req, {
            _id: current._id,
            __v: expectedVersion,
            "payments.idempotencyKey": { $ne: idempotencyKey },
          }),
          {
            $set: {
              financials: nextFinancials,
              paymentStatus: paymentState.paymentStatus,
              paymentLabel: paymentState.paymentLabel,
              paymentMethod: method,
            },
            $push: { payments: { $each: records } },
            $inc: { __v: 1 },
          },
          { session, runValidators: true }
        );

        if (writeResult.matchedCount !== 1) {
          if (attempt < 4) continue;
          throw new ConflictError("This sale order changed while the payment was being recorded");
        }

        try {
          await refreshCustomerFinancials(customerIds, req, session);
          return await SaleOrder.findOne(scopedFilter(req, { _id: current._id })).session(session);
        } catch (error) {
          if (!useTransaction) {
            await SaleOrder.updateOne(
              scopedFilter(req, { _id: current._id, __v: expectedVersion + 1 }),
              {
                $set: {
                  financials: previousState.financials,
                  paymentStatus: previousState.paymentStatus,
                  paymentLabel: previousState.paymentLabel,
                  paymentMethod: previousState.paymentMethod,
                },
                $pull: { payments: { idempotencyKey: { $in: records.map((record) => record.idempotencyKey) } } },
                $inc: { __v: -1 },
              },
              { session }
            ).catch(() => {});
            await refreshCustomerFinancials(customerIds, req, session).catch(() => {});
          }
          throw error;
        }
      }

      throw new ConflictError("This sale order is busy with another payment. Please retry.");
    });

    return res.status(200).json({ message: "Payment recorded", order: updated });
  } catch (error) {
    return handleControllerError(error, res, next);
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

      const customerId = customerIdOf(order);
      const compensations = [];
      try {
        await applyStockAdjustments({
          orderNumber: order.orderNumber,
          previousItems: order.items,
          nextItems: [],
          performedBy: resolveActorName(req),
          partyName: order.customer?.name,
          mode: "delete",
          session,
          compensations,
          req,
        });

        await SaleOrder.deleteOne(scopedFilter(req, { _id: order._id }), { session });
        await refreshCustomerFinancials([customerId], req, session);
      } catch (error) {
        if (!useTransaction) {
          await rollbackCompensations(compensations);
          await refreshCustomerFinancials([customerId], req, session).catch(() => {});
        }
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
