const mongoose = require("mongoose");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const Supplier = require("../models/Supplier");
const { runWithSession } = require("../utils/db");
const { tenantFilter } = require("../utils/tenant");
const { resolveActorName, DEFAULT_ACTOR_NAME } = require("../utils/actor");
const {
  normalizeUnit,
  toBasePieces,
  isSupportedUnit,
  priceForUnit,
  parseMoneyInput,
  parseStoredMoney,
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

const PURCHASE_STATUSES = [
  "Draft",
  "Ordered",
  "Partially Received",
  "Received",
  "Cancelled",
];
const RECEIVING_STATUSES = ["Partially Received", "Received"];
const BASE_PURCHASE_SEQUENCE = 2041;
const STATUS_RECEIPT_REFERENCE = "STATUS-RECEIVED";
const STATUS_RECEIPT_NOTES = "Purchase marked Received";

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

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}



function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const numeric = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toWholeNumber(value) {
  const numeric = Math.floor(toNumber(value, NaN));
  return Number.isFinite(numeric) ? numeric : null;
}

async function findProductForPurchaseItem(item, req = null) {
  const scope = req ? scopedFilter(req) : {};
  const productId = cleanString(item?.productId);
  if (productId && mongoose.isValidObjectId(productId)) {
    const byId = await Product.findOne({ ...scope, _id: productId })
      .select("title sku purchasePrice uom")
      .lean();
    if (byId) return byId;
  }

  const sku = cleanString(item?.sku);
  if (!sku) return null;
  return Product.findOne({ ...scope, sku })
    .select("title sku purchasePrice uom")
    .lean();
}

function basePurchasePrice(product) {
  return Math.max(toNumber(product?.purchasePrice), 0);
}



function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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

function sameCatalogSnapshot(previousItem, product, productId, sku) {
  if (!previousItem) return false;
  const previousId = cleanString(previousItem.productId).toLowerCase();
  const currentId = cleanString(product?._id || productId).toLowerCase();
  if (previousId && currentId) return previousId === currentId;

  const previousSku = cleanString(previousItem.sku).toLowerCase();
  const currentSku = cleanString(sku).toLowerCase();
  return Boolean(previousSku && currentSku && previousSku === currentSku);
}

function toDate(value, fallback) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = new Date(cleanString(value));
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return fallback;
}

async function generatePurchaseNumber(req, session) {
  const filter = scopedFilter(req, { purchaseNumber: /^PO-\d+$/ });
  const query = Purchase.find(filter).select("purchaseNumber");
  if (session) query.session(session);

  const purchases = await query.lean();

  const highest = purchases.reduce((max, purchase) => {
    const value = Number(cleanString(purchase.purchaseNumber).replace("PO-", ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, BASE_PURCHASE_SEQUENCE);

  return `PO-${highest + 1}`;
}

async function findPurchase(id, req, session) {
  const key = cleanString(id);
  const base = req ? scopedFilter(req) : {};
  if (mongoose.isValidObjectId(key)) {
    const query = Purchase.findOne({ ...base, _id: key });
    if (session) query.session(session);
    const byId = await query;
    if (byId) return byId;
  }
  const byNumber = Purchase.findOne({ ...base, purchaseNumber: key });
  if (session) byNumber.session(session);
  return byNumber;
}

function findExistingItem(bodyItem, index, existingItems) {
  const explicitId = cleanString(bodyItem?.id ?? bodyItem?.itemId ?? bodyItem?._id);
  if (explicitId && mongoose.isValidObjectId(explicitId)) {
    const found = existingItems.find(
      (item) => item._id && item._id.toString() === explicitId
    );
    if (found) return found;
  }

  const explicitIndex = toWholeNumber(bodyItem?.itemIndex);
  const fallbackIndex = explicitIndex === null ? index : explicitIndex;
  return existingItems[fallbackIndex] || null;
}

async function buildPurchaseChanges(body, existingPurchase = null, req = null) {
  const supplierId = cleanString(body.supplierId ?? body.supplier?.id);
  if (!mongoose.isValidObjectId(supplierId)) {
    throw new ValidationError("Select a supplier from the saved supplier list");
  }

  const supplierFilter = req ? scopedFilter(req, { _id: supplierId }) : { _id: supplierId };
  const supplier = await Supplier.findOne(supplierFilter).lean();
  if (!supplier) {
    throw new ValidationError("The selected supplier no longer exists");
  }

  const now = new Date();
  const purchaseDate = toDate(body.purchaseDate, now);
  const defaultDelivery = new Date(purchaseDate);
  defaultDelivery.setDate(defaultDelivery.getDate() + 3);
  const expectedDelivery = toDate(body.expectedDelivery, defaultDelivery);

  if (expectedDelivery < purchaseDate) {
    throw new ValidationError("Expected delivery cannot be before the purchase date");
  }

  const status = cleanString(body.status) || "Draft";
  if (!PURCHASE_STATUSES.includes(status)) {
    throw new ValidationError("Invalid purchase status");
  }
  if (status === "Received" && existingPurchase?.status === "Cancelled") {
    throw new ValidationError("Cancelled purchases cannot be received");
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new ValidationError("At least one purchase item is required");
  }

  const receivedAt = new Date();
  const receiptReference = cleanString(body.receiptReference) || STATUS_RECEIPT_REFERENCE;
  const receiptNotes = cleanString(body.receiptNotes) || STATUS_RECEIPT_NOTES;
  const performedBy = resolveActorName(req);
  const existingItems = Array.isArray(existingPurchase?.items) ? existingPurchase.items : [];
  const items = [];
  const stockUpdates = [];

  for (const [index, rawItem] of body.items.entries()) {
    const name = cleanString(rawItem?.name);
    const quantity = toWholeNumber(rawItem?.quantity);
    const submittedUnitPrice = requireMoney(
      rawItem?.unitPrice,
      `Item ${index + 1} unit price`
    );
    const productId = cleanString(rawItem?.productId);
    const sku = cleanString(rawItem?.sku);
    const rawUnit = cleanString(rawItem?.unit) || cleanString(rawItem?.unitLabel) || "Carton";
    const unit = normalizeUnit(rawUnit);
    if (!name || quantity === null || quantity <= 0) {
      throw new ValidationError(
        `Item ${index + 1} needs a name, a positive quantity, and a non-negative unit price`
      );
    }
    if (!unit || !isSupportedUnit(unit)) {
      throw new ValidationError(
        `Item ${index + 1} has an invalid unit. Use Carton, Box, or Piece`
      );
    }
    const baseQuantity = toBasePieces(quantity, unit);
    if (!Number.isFinite(baseQuantity) || baseQuantity <= 0) {
      throw new ValidationError(`Item ${index + 1} has an invalid quantity/unit conversion`);
    }

    const product = await findProductForPurchaseItem({ productId, sku }, req);
    if ((productId || sku) && !product) {
      throw new ValidationError("The selected product no longer exists");
    }

    if (product && basePurchasePrice(product) <= 0) {
      throw new ValidationError(`Set a purchase price for ${product.title} before purchasing`);
    }

    const existingItem = findExistingItem(rawItem, index, existingItems);
    const catalogBasePrice = product
      ? requireMoney(product.purchasePrice, `Catalog price for ${product.title}`)
      : null;
    const catalogUnitPrice = catalogBasePrice === null
      ? null
      : priceForUnit(catalogBasePrice, unit);
    const keepSnapshot = Boolean(
      product &&
        existingItem &&
        cleanString(existingItem.priceBasis) !== "manual" &&
        sameCatalogSnapshot(existingItem, product, productId, sku) &&
        normalizeUnit(existingItem.unit) === unit
    );
    const savedBasePrice = keepSnapshot ? parseStoredMoney(existingItem.basePrice) : null;
    const savedUnitPrice = keepSnapshot ? parseStoredMoney(existingItem.unitPrice) : null;
    const basePrice = product
      ? savedBasePrice !== null
        ? savedBasePrice
        : catalogBasePrice ?? 0
      : submittedUnitPrice;
    const unitPrice = product
      ? savedUnitPrice !== null
        ? savedUnitPrice
        : catalogUnitPrice ?? 0
      : submittedUnitPrice;
    const priceBasis = product ? "catalog" : "manual";

    const previousReceived = Math.max(0, Number(existingItem?.receivedQuantity) || 0);
    const previousReceivedBase = Math.max(
      0,
      Number(existingItem?.receivedBaseQuantity) || toBasePieces(previousReceived, normalizeUnit(existingItem?.unit) || unit) || 0
    );
    const availableStock = Math.max(
      0,
      Number(
        existingItem
          ? existingItem.availableStock ?? rawItem?.availableStock
          : rawItem?.availableStock
      ) || 0
    );
    let receivedQuantity = existingItem ? toWholeNumber(rawItem?.receivedQuantity) : 0;
    const receipts = Array.isArray(existingItem?.receipts) ? [...existingItem.receipts] : [];

    if (existingItem) {
      if (status !== "Received") {
        if (receivedQuantity === null || receivedQuantity < 0) {
          receivedQuantity = previousReceived;
        }
        if (receivedQuantity < previousReceived) {
          throw new ValidationError(
            `Received quantity for ${name} cannot be reduced below ${previousReceived}`
          );
        }
        if (receivedQuantity > previousReceived) {
          throw new ValidationError(
            `Goods received for ${name} must be recorded using the Receive Goods action`
          );
        }
      }
      if (previousReceived > 0 && productId !== cleanString(existingItem?.productId)) {
        throw new ValidationError(
          `The product for ${name} cannot be changed after goods have been received`
        );
      }
    }

    if (status === "Received") {
      if (quantity < previousReceived) {
        throw new ValidationError(
          `Received quantity for ${name} cannot be reduced below ${previousReceived}`
        );
      }

      receivedQuantity = quantity;
      const delta = receivedQuantity - previousReceived;
      const baseDelta = baseQuantity - previousReceivedBase;
      if (delta > 0) {
        receipts.push(
          createReceiptEntry({
            quantity: delta,
            receivedQuantity,
            baseQuantity: baseDelta,
            receivedBaseQuantity: baseQuantity,
            reference: receiptReference,
            notes: receiptNotes,
            receivedAt,
            performedBy,
          })
        );

        const resolvedProductId = product?._id ? String(product._id) : productId;
        if (product && mongoose.isValidObjectId(resolvedProductId)) {
          stockUpdates.push({
            productId: resolvedProductId,
            delta: baseDelta,
            itemName: name,
            unit,
            originalQuantity: delta,
            originalUnit: unit,
            product,
          });
        }
      }
    }

    if (receivedQuantity > quantity) {
      throw new ValidationError(
        `Received quantity for ${name} cannot exceed the ordered quantity`
      );
    }
    const receivedBaseQuantity =
      status === "Received"
        ? baseQuantity
        : Math.max(
            0,
            Number(existingItem?.receivedBaseQuantity) ||
              toBasePieces(receivedQuantity, normalizeUnit(existingItem?.unit) || unit) ||
              0
          );

    const itemSubtotal = round(quantity * unitPrice);
    const discount = clamp(requireMoney(rawItem?.discount, `Item ${index + 1} discount`), 0, itemSubtotal);
    const taxRate = clamp(
      rawItem?.taxRate === undefined || rawItem?.taxRate === null || rawItem?.taxRate === ""
        ? 18
        : requireMoney(rawItem.taxRate, `Item ${index + 1} tax rate`),
      0,
      100
    );
    const taxAmount = round(((itemSubtotal - discount) * taxRate) / 100);
    const lineTotal = round(itemSubtotal - discount + taxAmount);

    items.push({
      productId: product?._id ? String(product._id) : productId,
      name,
      sku,
      quantity,
      baseQuantity,
      availableStock: product ? Math.max(0, Number(product.openingStock) || 0) : availableStock,
      receivedQuantity,
      receivedBaseQuantity,
      receipts,
      unit,
      priceBasis,
      basePrice,
      unitPrice,
      discount,
      taxRate,
      taxAmount,
      lineTotal,
    });
  }

  const subtotal = round(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const discount = round(items.reduce((sum, item) => sum + item.discount, 0));
  const tax = round(items.reduce((sum, item) => sum + item.taxAmount, 0));
  const freight = requireMoney(body.freight, "Freight");
  const total = round(subtotal - discount + tax + freight);

  if (total <= 0) {
    throw new ValidationError("Purchase total must be greater than zero");
  }

  // Initial payment is accepted only on create. Edits record payments through
  // the dedicated /payment endpoint so the existing ledger stays immutable.
  const paymentAmount = existingPurchase ? 0 : requireMoney(body.paymentAmount, "Payment amount");
  if (paymentAmount > total) {
    throw new ValidationError(`Payment cannot exceed the purchase total of ${total}`);
  }
  const paidAmount = round(paymentAmount);
  const initialPayments = paidAmount > 0
    ? [{
        amount: paidAmount,
        method: cleanString(body.paymentMethod) || "Cash",
        reference: cleanString(body.paymentReference) || cleanString(body.invoiceNumber),
        paidAt: now,
        createdBy: resolveActorName(req),
      }]
    : [];

  const wasCancelled = existingPurchase?.status === "Cancelled";
  if (wasCancelled && status !== "Cancelled") {
    throw new ValidationError("Cancelled purchases cannot be reactivated");
  }

  const anyReceived = items.some((item) => item.receivedQuantity > 0);
  const allReceived = items.every((item) => item.receivedQuantity >= item.quantity);
  const derivedStatus = status === "Cancelled"
    ? "Cancelled"
    : allReceived
      ? "Received"
      : anyReceived
        ? "Partially Received"
        : ["Draft", "Ordered"].includes(status)
          ? status
          : "Draft";

  if (derivedStatus === "Cancelled" && !wasCancelled) {
    for (const item of existingItems) {
      const received = Math.max(0, Number(item.receivedQuantity) || 0);
      const receivedBase = Math.max(
        0,
        Number(item.receivedBaseQuantity) ||
          toBasePieces(received, normalizeUnit(item.unit) || "Piece") ||
          received
      );
      const productId = cleanString(item.productId);
      if (receivedBase <= 0 || !mongoose.isValidObjectId(productId)) continue;
      stockUpdates.push({
        productId,
        delta: -receivedBase,
        itemName: cleanString(item.name),
        unit: normalizeUnit(item.unit) || item.unit || "Piece",
        originalQuantity: received,
        originalUnit: normalizeUnit(item.unit) || item.unit || "Piece",
        product: null,
      });
    }
  }

  return {
    changes: {
      supplier: {
        id: supplier._id.toString(),
        code: supplier.supplierCode,
        name: supplier.name,
        contact: supplier.contactPerson,
        phone: supplier.phone,
        hub: supplier.hub || supplier.region || "",
        address: supplier.address,
        ntn: supplier.ntn || "",
        paymentTerms: supplier.paymentTerms || "",
        productIds: Array.isArray(supplier.productIds)
          ? supplier.productIds.map(String)
          : [],
      },
      purchaseDate,
      expectedDelivery,
      invoiceNumber: cleanString(body.invoiceNumber),
      items,
      financials: {
        subtotal,
        discount,
        tax,
        freight,
        total,
      },
      paidAmount,
      payments: initialPayments,
      status: derivedStatus,
      notes: cleanString(body.notes),
      createdBy: resolveActorName(req),
    },
    stockUpdates,
  };
}

function handleControllerError(error, res, next) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ message: error.message });
  }
  if (error instanceof ConflictError) {
    return res.status(409).json({ message: error.message });
  }
  return next(error);
}

function itemKey(item, index) {
  return item._id ? item._id.toString() : `index:${index}`;
}

function createReceiptEntry({
  quantity,
  receivedQuantity,
  baseQuantity = 0,
  receivedBaseQuantity = 0,
  reference,
  notes,
  receivedAt,
  performedBy,
}) {
  return {
    quantity,
    receivedQuantity,
    baseQuantity: Math.max(0, Math.floor(Number(baseQuantity) || 0)),
    receivedBaseQuantity: Math.max(0, Math.floor(Number(receivedBaseQuantity) || 0)),
    reference,
    notes: cleanString(notes),
    receivedAt,
    performedBy: cleanString(performedBy) || DEFAULT_ACTOR_NAME,
  };
}

async function applyStockReceipt({
  compensations = [],
  productId,
  delta,
  itemName,
  unit,
  originalQuantity = null,
  originalUnit = "",
  reference,
  notes,
  performedBy,
  partyName,
  session,
  productSnapshot = null,
  businessId = null,
  createdByUserId = null,
}) {
  if (!delta || !mongoose.isValidObjectId(productId)) return null;

  const scope = businessId ? { _id: productId, businessId } : { _id: productId };
  const snapshotQuery = Product.findOne(scope).select("title sku uom openingStock");
  if (session) snapshotQuery.session(session);
  const product =
    productSnapshot && productSnapshot._id
      ? productSnapshot
      : await snapshotQuery.lean();

  if (!product) {
    throw new ValidationError(`The product linked to ${itemName} no longer exists`);
  }

  const targetId = String(product._id || productId);
  const updatedProduct = await Product.findOneAndUpdate(
    scope,
    { $inc: { openingStock: delta } },
    { new: true, runValidators: true, session }
  );

  if (!updatedProduct) {
    throw new ValidationError(`The product linked to ${itemName} no longer exists`);
  }

  compensations.push(async () => {
    await Product.findOneAndUpdate(scope, { $inc: { openingStock: -delta } }, { session });
  });

  const newStock = Number(updatedProduct.openingStock) || 0;
  const baseDelta = Math.max(0, Math.floor(Math.abs(Number(delta) || 0)));
  const movementUnit = normalizeUnit(originalUnit || unit) || cleanString(unit) || "";
  const [movement] = await StockMovement.create(
    [
      {
        product: targetId,
        sku: product.sku,
        productTitle: product.title,
        type: "purchase",
        direction: delta >= 0 ? "in" : "out",
        quantity: baseDelta,
        originalQuantity: Math.max(
          0,
          Number(originalQuantity) || toBasePieces(baseDelta, "Piece") || baseDelta
        ),
        originalUnit: movementUnit,
        baseQuantity: baseDelta,
        previousStock: newStock - delta,
        newStock,
        unit: movementUnit || product.uom || "",
        reason: delta >= 0 ? "Purchase goods receipt" : "Purchase stock reversal",
        reference,
        notes: cleanString(notes),
        performedBy: cleanString(performedBy) || DEFAULT_ACTOR_NAME,
        partyName: cleanString(partyName),
        ...(businessId ? { businessId, createdByUserId } : {}),
      },
    ],
    { session }
  );

  compensations.push(async () => {
    await StockMovement.deleteOne({ _id: movement._id }, { session });
  });

  return movement;
}

async function runCompensations(compensations) {
  for (const compensate of compensations.reverse()) {
    try {
      await compensate();
    } catch (compensationError) {
      console.error("Failed to compensate purchase receipt:", compensationError.message);
    }
  }
}

function resolveReceiptItem(purchase, rawItem, index) {
  const explicitId = cleanString(rawItem?.itemId ?? rawItem?.id ?? rawItem?._id);
  const explicitIndex = toWholeNumber(rawItem?.itemIndex);

  if (explicitId) {
    if (!mongoose.isValidObjectId(explicitId)) {
      throw new ValidationError("Each received item needs a valid item reference");
    }
    const objectId = new mongoose.Types.ObjectId(explicitId);
    const item = purchase.items.find(
      (candidate) => candidate._id && candidate._id.toString() === explicitId
    );
    if (!item) {
      throw new ValidationError("One of the received items does not belong to this purchase");
    }
    return {
      item,
      key: explicitId,
      path: "items.$[item]",
      arrayFilter: { "item._id": objectId },
    };
  }

  if (explicitIndex !== null && purchase.items[explicitIndex]) {
    const item = purchase.items[explicitIndex];
    return {
      item,
      key: itemKey(item, explicitIndex),
      path: `items.${explicitIndex}`,
      arrayFilter: null,
    };
  }

  throw new ValidationError("Each received item needs a valid item reference");
}

async function getNextPurchaseCode(req, res, next) {
  try {
    return res.status(200).json({ code: await generatePurchaseNumber(req) });
  } catch (error) {
    return next(error);
  }
}

async function getPurchases(req, res, next) {
  try {
    const supplierId = cleanString(req.query?.supplierId);
    if (supplierId && !mongoose.isValidObjectId(supplierId)) {
      return res.status(400).json({ message: "Invalid supplierId" });
    }

    const filter = scopedFilter(req, supplierId ? { "supplier.id": supplierId } : {});
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      filter.$or = [
        { purchaseNumber: { $regex: search, $options: "i" } },
        { "supplier.name": { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }
    const purchases = await Purchase.find(filter).sort({ purchaseDate: -1, createdAt: -1 });
    return res.status(200).json({ purchases });
  } catch (error) {
    return next(error);
  }
}

async function createPurchase(req, res, next) {
  try {
    const { changes, stockUpdates } = await buildPurchaseChanges(req.body || {}, null, req);
    const businessId = tenantBusinessId(req);
    const createdByUserId = isTenantEnforced(req) ? req.auth.id : null;
    const purchase = await runWithSession(async (session, useTransaction) => {
      const compensations = [];
      let created;
      try {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            const [document] = await Purchase.create(
              [
                {
                  purchaseNumber: await generatePurchaseNumber(req, session),
                  ...changes,
                  ...(businessId ? { businessId, createdByUserId } : {}),
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

        for (const update of stockUpdates) {
          await applyStockReceipt({
            compensations,
            productId: update.productId,
            delta: update.delta,
            itemName: update.itemName,
            unit: update.unit,
            originalQuantity: update.originalQuantity,
            originalUnit: update.originalUnit || update.unit,
            reference: `${created.purchaseNumber} - ${STATUS_RECEIPT_REFERENCE}`,
            notes: STATUS_RECEIPT_NOTES,
            performedBy: changes.createdBy,
            partyName: changes.supplier.name,
            productSnapshot: update.product,
            session,
            businessId,
            createdByUserId,
          });
        }

        return created;
      } catch (error) {
        if (!useTransaction) await runCompensations(compensations);
        if (created) {
          await Purchase.deleteOne({ _id: created._id }, { session }).catch(() => {});
        }
        throw error;
      }
    });

    return res.status(201).json({ message: "Purchase created", purchase });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function getPurchaseById(req, res, next) {
  try {
    const purchase = await findPurchase(req.params.id, req);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }
    return res.status(200).json({ purchase });
  } catch (error) {
    return next(error);
  }
}

async function getPurchaseByNumber(req, res, next) {
  try {
    const purchaseNumber = cleanString(req.params.purchaseNumber);
    if (!purchaseNumber) {
      return res.status(400).json({ message: "purchaseNumber is required" });
    }
    const purchase = await Purchase.findOne(scopedFilter(req, { purchaseNumber }));
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }
    return res.status(200).json({ purchase });
  } catch (error) {
    return next(error);
  }
}

async function updatePurchase(req, res, next) {
  try {
    const purchase = await findPurchase(req.params.id, req);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const { changes, stockUpdates } = await buildPurchaseChanges(req.body || {}, purchase, req);
    const businessId = tenantBusinessId(req);
    const createdByUserId = isTenantEnforced(req) ? req.auth.id : null;
    const previousState = {
      status: purchase.status,
      items: purchase.items.map((item) =>
        typeof item.toObject === "function" ? item.toObject() : { ...item }
      ),
    };

    const updated = await runWithSession(async (session, useTransaction) => {
      const compensations = [];
      try {
        if (stockUpdates.length > 0) {
          compensations.push(async () => {
            await Purchase.updateOne(
              { _id: purchase._id },
              { $set: previousState },
              { session }
            );
          });
        }

        purchase.set({
          ...changes,
          paidAmount: Number(purchase.paidAmount) || 0,
          payments: purchase.payments || [],
          createdBy: purchase.createdBy,
          createdAt: purchase.createdAt,
        });
        await purchase.save({ session });

        for (const update of stockUpdates) {
          await applyStockReceipt({
            compensations,
            productId: update.productId,
            delta: update.delta,
            itemName: update.itemName,
            unit: update.unit,
            originalQuantity: update.originalQuantity,
            originalUnit: update.originalUnit || update.unit,
            reference: `${purchase.purchaseNumber} - ${STATUS_RECEIPT_REFERENCE}`,
            notes: STATUS_RECEIPT_NOTES,
            performedBy: changes.createdBy,
            partyName: changes.supplier.name,
            productSnapshot: update.product,
            session,
            businessId,
            createdByUserId,
          });
        }

        return purchase;
      } catch (error) {
        if (!useTransaction) await runCompensations(compensations);
        throw error;
      }
    });

    return res.status(200).json({ message: "Purchase updated", purchase: updated });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function updatePurchaseStatus(req, res, next) {
  try {
    const purchase = await findPurchase(req.params.id, req);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const status = cleanString(req.body?.status);
    if (!PURCHASE_STATUSES.includes(status)) {
      throw new ValidationError("Invalid purchase status");
    }
    if (RECEIVING_STATUSES.includes(status)) {
      throw new ValidationError(
        "Use the Receive Goods action to update partial or full receiving status"
      );
    }

    if (status === "Cancelled" && purchase.status !== "Cancelled") {
      const businessId = tenantBusinessId(req);
      const createdByUserId = isTenantEnforced(req) ? req.auth.id : null;
      const updated = await runWithSession(async (session, useTransaction) => {
        const compensations = [];
        try {
          for (const item of purchase.items || []) {
            const received = Math.max(0, Number(item.receivedQuantity) || 0);
            const receivedBase = Math.max(
              0,
              Number(item.receivedBaseQuantity) ||
                toBasePieces(received, normalizeUnit(item.unit) || "Piece") ||
                received
            );
            const productId = cleanString(item.productId);
            if (receivedBase <= 0 || !mongoose.isValidObjectId(productId)) continue;
            await applyStockReceipt({
              compensations,
              productId,
              delta: -receivedBase,
              itemName: item.name,
              unit: normalizeUnit(item.unit) || item.unit || "Piece",
              originalQuantity: received,
              originalUnit: normalizeUnit(item.unit) || item.unit || "Piece",
              reference: `${purchase.purchaseNumber} - CANCELLED`,
              notes: "Stock reversed due to purchase cancellation",
              performedBy: resolveActorName(req),
              partyName: purchase.supplier?.name,
              session,
              businessId,
              createdByUserId,
            });
          }
          purchase.status = "Cancelled";
          await purchase.save({ session });
          return purchase;
        } catch (error) {
          if (!useTransaction) await runCompensations(compensations);
          throw error;
        }
      });
      return res.status(200).json({ message: "Purchase status updated", purchase: updated });
    }

    if (purchase.status === "Cancelled" && status !== "Cancelled") {
      throw new ValidationError("Cancelled purchases cannot be reactivated");
    }

    purchase.status = status;
    await purchase.save();
    return res.status(200).json({ message: "Purchase status updated", purchase });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function receivePurchase(req, res, next) {
  try {
    const purchase = await findPurchase(req.params.id, req);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }
    if (purchase.status === "Cancelled") {
      throw new ValidationError("Cancelled purchases cannot receive goods");
    }

    const rawItems = req.body?.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new ValidationError("At least one received item is required");
    }

    const receivedAt = new Date();
    const receiptReference = cleanString(req.body?.reference) || "GRN";
    const receiptNotes = cleanString(req.body?.notes);
    const performedBy = resolveActorName(req);
    const updates = [];
    const seenKeys = new Set();

    rawItems.forEach((rawItem, index) => {
      const target = resolveReceiptItem(purchase, rawItem, index);
      if (seenKeys.has(target.key)) {
        throw new ValidationError("The same purchase item was submitted more than once");
      }
      seenKeys.add(target.key);

      const ordered = Math.max(0, Number(target.item.quantity) || 0);
      const previousReceived = Math.max(0, Number(target.item.receivedQuantity) || 0);
      const desired = toWholeNumber(rawItem?.receivedQuantity);

      if (desired === null || desired < 0) {
        throw new ValidationError("Received quantity must be a non-negative whole number");
      }
      if (desired < previousReceived) {
        throw new ValidationError(
          `Received quantity for ${target.item.name} cannot be reduced below ${previousReceived}`
        );
      }
      if (desired > ordered) {
        throw new ValidationError(
          `Received quantity for ${target.item.name} cannot exceed the ordered quantity of ${ordered}`
        );
      }

      const itemUnit = normalizeUnit(target.item.unit) || "Piece";
      const itemBaseQty = Math.max(0, Number(target.item.baseQuantity) || toBasePieces(ordered, itemUnit) || 0);
      const previousReceivedBase = Math.max(
        0,
        Number(target.item.receivedBaseQuantity) || toBasePieces(previousReceived, itemUnit) || 0
      );
      const desiredBase = desired >= ordered ? itemBaseQty || toBasePieces(desired, itemUnit) || 0 : toBasePieces(desired, itemUnit) || 0;
      const baseDelta = Math.max(0, desiredBase - previousReceivedBase);
      updates.push({
        ...target,
        ordered,
        previousReceived,
        previousReceivedBase,
        desired,
        desiredBase,
        delta: desired - previousReceived,
        baseDelta,
        itemUnit,
      });
    });

    const finalReceived = new Map();
    purchase.items.forEach((item, index) => {
      finalReceived.set(itemKey(item, index), Math.max(0, Number(item.receivedQuantity) || 0));
    });
    updates.forEach((update) => finalReceived.set(update.key, update.desired));

    const allReceived = purchase.items.every((item, index) => {
      const received = finalReceived.get(itemKey(item, index)) || 0;
      return received >= Math.max(0, Number(item.quantity) || 0);
    });
    const anyReceived = purchase.items.some((item, index) => {
      const received = finalReceived.get(itemKey(item, index)) || 0;
      return received > 0;
    });
    const nextStatus = allReceived
      ? "Received"
      : anyReceived
        ? "Partially Received"
        : purchase.status;
    const previousStatus = purchase.status;
    const hasChanges = updates.some((update) => update.delta > 0);

    const updated = await runWithSession(async (session, useTransaction) => {
      const compensations = [];

      try {
        for (const update of updates) {
          if (update.delta === 0) continue;

          const receipt = createReceiptEntry({
            quantity: update.delta,
            receivedQuantity: update.desired,
            baseQuantity: update.baseDelta,
            receivedBaseQuantity: update.desiredBase,
            reference: receiptReference,
            notes: receiptNotes,
            receivedAt,
            performedBy,
          });

          const casFilter = update.arrayFilter
            ? {
                _id: purchase._id,
                items: {
                  $elemMatch: {
                    _id: update.arrayFilter["item._id"],
                    receivedQuantity: update.previousReceived,
                  },
                },
              }
            : {
                _id: purchase._id,
                [`${update.path}.receivedQuantity`]: update.previousReceived,
              };
          const options = update.arrayFilter
            ? { arrayFilters: [update.arrayFilter], session }
            : { session };

          const receiptResult = await Purchase.updateOne(
            casFilter,
            {
              $set: {
                [`${update.path}.receivedQuantity`]: update.desired,
                [`${update.path}.receivedBaseQuantity`]: update.desiredBase,
              },
              $push: { [`${update.path}.receipts`]: receipt },
            },
            options
          );

          if (receiptResult.matchedCount !== 1) {
            const current = await Purchase.findById(purchase._id).session(session).lean();
            const currentItem = current?.items?.find((candidate) => {
              if (update.arrayFilter) {
                return (
                  candidate._id &&
                  candidate._id.toString() ===
                    update.arrayFilter["item._id"].toString()
                );
              }
              return itemKey(candidate, purchase.items.indexOf(update.item)) === update.key;
            });
            const currentReceived = Math.max(0, Number(currentItem?.receivedQuantity) || 0);
            if (currentReceived === update.desired) {
              continue;
            }
            throw new ConflictError(
              "This purchase changed while receiving. Refresh the page and try again."
            );
          }

          const rollbackFilter = update.arrayFilter
            ? {
                _id: purchase._id,
                items: {
                  $elemMatch: {
                    _id: update.arrayFilter["item._id"],
                    receivedQuantity: update.desired,
                  },
                },
              }
            : {
                _id: purchase._id,
                [`${update.path}.receivedQuantity`]: update.desired,
              };

          compensations.push(async () => {
            await Purchase.updateOne(
              rollbackFilter,
              {
                $set: {
                  [`${update.path}.receivedQuantity`]: update.previousReceived,
                  [`${update.path}.receivedBaseQuantity`]: update.previousReceivedBase,
                },
                $pull: {
                  [`${update.path}.receipts`]: {
                    quantity: update.delta,
                    receivedQuantity: update.desired,
                    receivedAt,
                  },
                },
              },
              options
            );
          });

          await applyStockReceipt({
            compensations,
            productId: cleanString(update.item.productId),
            delta: update.baseDelta,
            itemName: update.item.name,
            unit: normalizeUnit(update.item.unit) || update.item.unit || "Piece",
            originalQuantity: update.delta,
            originalUnit: normalizeUnit(update.item.unit) || update.item.unit || "Piece",
            businessId: tenantBusinessId(req),
            createdByUserId: isTenantEnforced(req) ? req.auth.id : null,
            reference: `${purchase.purchaseNumber} - ${receiptReference}`,
            notes: receiptNotes,
            performedBy,
            partyName: purchase.supplier?.name,
            session,
          });
        }

        if (hasChanges && nextStatus !== previousStatus) {
          const statusResult = await Purchase.updateOne(
            { _id: purchase._id, status: previousStatus },
            { $set: { status: nextStatus } },
            { session }
          );

          if (statusResult.matchedCount !== 1) {
            throw new ConflictError(
              "This purchase changed while receiving. Refresh the page and try again."
            );
          }

          compensations.push(async () => {
            await Purchase.updateOne(
              { _id: purchase._id, status: nextStatus },
              { $set: { status: previousStatus } },
              { session }
            );
          });
        }

        return Purchase.findById(purchase._id).session(session);
      } catch (error) {
        if (!useTransaction) await runCompensations(compensations);
        throw error;
      }
    });

    return res.status(200).json({ message: "Goods received successfully", purchase: updated });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function recordPurchasePayment(req, res, next) {
  try {
    const purchase = await findPurchase(req.params.id, req);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const amount = toNumber(req.body?.amount);
    if (amount <= 0) {
      throw new ValidationError("Payment amount must be greater than zero");
    }

    const total = Number(purchase.financials?.total) || 0;
    const paid = Number(purchase.paidAmount) || 0;
    const remaining = Math.max(total - paid, 0);
    if (amount > remaining) {
      throw new ValidationError(`Payment cannot exceed the remaining balance of ${remaining}`);
    }

    purchase.payments = purchase.payments || [];
    purchase.payments.push({
      amount,
      method: cleanString(req.body?.method) || "Cash",
      reference: cleanString(req.body?.reference),
      paidAt: new Date(),
      createdBy: resolveActorName(req),
    });
    purchase.paidAmount = round(paid + amount);
    await purchase.save();

    return res.status(200).json({ message: "Payment recorded", purchase });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function deletePurchase(req, res, next) {
  try {
    const purchase = await findPurchase(req.params.id, req);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    await runWithSession(async (session, useTransaction) => {
      const compensations = [];

      try {
        const references = new Set();
        for (const item of purchase.items) {
          const received = Math.max(0, Number(item.receivedQuantity) || 0);
          const receivedBase = Math.max(
            0,
            Number(item.receivedBaseQuantity) ||
              toBasePieces(received, normalizeUnit(item.unit) || "Piece") ||
              received
          );
          const productId = cleanString(item.productId);

          for (const receipt of item.receipts || []) {
            const reference = cleanString(receipt.reference);
            if (reference) {
              references.add(`${purchase.purchaseNumber} - ${reference}`);
              references.add(`${purchase.purchaseNumber} \u2014 ${reference}`);
              references.add(`${purchase.purchaseNumber} A� ${reference}`);
            }
          }

          if (receivedBase === 0 || !mongoose.isValidObjectId(productId)) continue;

          const scope = tenantBusinessId(req)
            ? { _id: productId, businessId: tenantBusinessId(req) }
            : { _id: productId };
          const product = await Product.findOneAndUpdate(
            scope,
            { $inc: { openingStock: -receivedBase } },
            { new: true, runValidators: true, session }
          );
          if (!product) {
            throw new ValidationError(
              `The product linked to ${item.name} no longer exists`
            );
          }

          compensations.push(async () => {
            await Product.findOneAndUpdate(
              scope,
              { $inc: { openingStock: receivedBase } },
              { session }
            );
          });
        }

        if (references.size > 0) {
          const movementFilter = {
            type: "purchase",
            reference: { $in: Array.from(references) },
            ...(tenantBusinessId(req) ? { businessId: tenantBusinessId(req) } : {}),
          };
          const movementQuery = StockMovement.find(movementFilter);
          movementQuery.session(session);
          const movements = await movementQuery.lean();

          if (movements.length > 0) {
            await StockMovement.deleteMany(movementFilter, { session });
            compensations.push(async () => {
              await StockMovement.insertMany(movements, { session });
            });
          }
        }

        const purchaseSnapshot = purchase.toObject();
        const deleted = await Purchase.deleteOne({ _id: purchase._id }, { session });
        if (deleted.deletedCount !== 1) {
          throw new ConflictError("This purchase changed while deleting. Refresh and try again.");
        }
        compensations.push(async () => {
          await Purchase.create(purchaseSnapshot, { session });
        });

        return purchase;
      } catch (error) {
        if (!useTransaction) {
          for (const compensate of compensations.reverse()) {
            try {
              await compensate();
            } catch (compensationError) {
              console.error(
                "Failed to compensate purchase deletion:",
                compensationError.message
              );
            }
          }
        }
        throw error;
      }
    });

    return res.status(200).json({ message: "Purchase deleted" });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

module.exports = {
  getNextPurchaseCode,
  getPurchases,
  getPurchaseById,
  getPurchaseByNumber,
  createPurchase,
  updatePurchase,
  updatePurchaseStatus,
  receivePurchase,
  recordPurchasePayment,
  deletePurchase,
};
