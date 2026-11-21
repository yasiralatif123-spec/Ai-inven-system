const mongoose = require("mongoose");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const Supplier = require("../models/Supplier");
const { runWithSession } = require("../utils/db");
const {
  applyFlavorStockChanges,
  flavorBreakdown,
  totalStockDelta,
  uniqueFlavors,
} = require("../utils/flavor-stock");

const PURCHASE_STATUSES = [
  "Draft",
  "Ordered",
  "Partially Received",
  "Received",
  "Cancelled",
];
const RECEIVING_STATUSES = ["Partially Received", "Received"];
const BASE_PURCHASE_SEQUENCE = 2041;
const DEFAULT_RECEIVED_BY = "Tariq M. (Owner)";
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

function normalizeFlavorValues(value) {
  const raw = Array.isArray(value)
    ? value
    : value === undefined || value === null || value === ""
      ? []
      : [value];
  const result = [];
  for (const entry of raw) {
    for (const part of String(entry).split(/[\n,]/)) {
      const label = cleanString(part).replace(/\s+/g, " ");
      if (!label) continue;
      if (label.length > 120) {
        throw new ValidationError("Flavor cannot exceed 120 characters");
      }
      if (!result.some((existing) => existing.toLowerCase() === label.toLowerCase())) {
        result.push(label);
      }
      if (result.length >= 24) return result;
    }
  }
  return result;
}

function toPlainMap(value) {
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  return {};
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

async function findProductForPurchaseItem(item) {
  const productId = cleanString(item?.productId);
  if (productId && mongoose.isValidObjectId(productId)) {
    const byId = await Product.findById(productId)
      .select("title sku purchasePrice flavors uom")
      .lean();
    if (byId) return byId;
  }

  const sku = cleanString(item?.sku);
  if (!sku) return null;
  return Product.findOne({ sku }).select("title sku purchasePrice flavors uom").lean();
}

function basePurchasePrice(product) {
  return Math.max(toNumber(product?.purchasePrice), 0);
}

function sameFlavorSet(left, right) {
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

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toDate(value, fallback) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = new Date(cleanString(value));
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return fallback;
}

async function generatePurchaseNumber(session) {
  const query = Purchase.find({ purchaseNumber: /^PO-\d+$/ }).select("purchaseNumber");
  if (session) query.session(session);

  const purchases = await query.lean();

  const highest = purchases.reduce((max, purchase) => {
    const value = Number(cleanString(purchase.purchaseNumber).replace("PO-", ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, BASE_PURCHASE_SEQUENCE);

  return `PO-${highest + 1}`;
}

async function findPurchase(id) {
  const key = cleanString(id);
  if (mongoose.isValidObjectId(key)) {
    const byId = await Purchase.findById(key);
    if (byId) return byId;
  }
  return Purchase.findOne({ purchaseNumber: key });
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

async function buildPurchaseChanges(body, existingPurchase = null) {
  const supplierId = cleanString(body.supplierId ?? body.supplier?.id);
  if (!mongoose.isValidObjectId(supplierId)) {
    throw new ValidationError("Select a supplier from the saved supplier list");
  }

  const supplier = await Supplier.findById(supplierId).lean();
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
  const performedBy = cleanString(body.performedBy ?? body.createdBy) || DEFAULT_RECEIVED_BY;
  const existingItems = Array.isArray(existingPurchase?.items) ? existingPurchase.items : [];
  const items = [];
  const stockUpdates = [];

  for (const [index, rawItem] of body.items.entries()) {
    const name = cleanString(rawItem?.name);
    const quantity = Math.floor(toNumber(rawItem?.quantity));
    const submittedUnitPrice = toNumber(rawItem?.unitPrice);
    const productId = cleanString(rawItem?.productId);
    const sku = cleanString(rawItem?.sku);
    const flavors = normalizeFlavorValues(rawItem?.flavor);

    if (!name || quantity <= 0 || submittedUnitPrice < 0) {
      throw new ValidationError(
        `Item ${index + 1} needs a name, a positive quantity, and a non-negative unit price`
      );
    }

    const product = await findProductForPurchaseItem({ productId, sku });
    const productHasFlavors = Boolean(
      product && Array.isArray(product.flavors) && product.flavors.length > 0
    );

    if (product && basePurchasePrice(product) <= 0) {
      throw new ValidationError(`Set a purchase price for ${product.title} before purchasing`);
    }
    if (productHasFlavors && flavors.length === 0) {
      throw new ValidationError(`Select at least one flavor for ${product.title}`);
    }

    const existingItem = findExistingItem(rawItem, index, existingItems);
    const previousFlavors = existingItem ? normalizeFlavorValues(existingItem.flavor) : [];
    const flavorsChanged = !existingItem || !sameFlavorSet(previousFlavors, flavors);
    const flavorCount = productHasFlavors ? flavors.length : 1;
    const basePrice = product
      ? !existingPurchase || flavorsChanged
        ? basePurchasePrice(product)
        : Number(existingItem?.basePrice) || basePurchasePrice(product)
      : submittedUnitPrice;
    const unitPrice = product
      ? !existingPurchase || flavorsChanged
        ? basePrice * flavorCount
        : Number(existingItem?.unitPrice) || submittedUnitPrice
      : submittedUnitPrice;

    const previousReceived = Math.max(0, Number(existingItem?.receivedQuantity) || 0);
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
      if (delta > 0) {
        receipts.push(
          createReceiptEntry({
            quantity: delta,
            receivedQuantity,
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
            delta,
            flavors,
            itemName: name,
            unit: cleanString(rawItem?.unit) || "Carton",
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

    const itemSubtotal = round(quantity * unitPrice);
    const discount = clamp(toNumber(rawItem?.discount), 0, itemSubtotal);
    const taxRate = clamp(toNumber(rawItem?.taxRate, 18), 0, 100);
    const taxAmount = round(((itemSubtotal - discount) * taxRate) / 100);
    const lineTotal = round(itemSubtotal - discount + taxAmount);

    items.push({
      productId: product?._id ? String(product._id) : productId,
      name,
      sku,
      flavor: flavors,
      quantity,
      availableStock,
      receivedQuantity,
      receipts,
      unit: cleanString(rawItem?.unit) || "Carton",
      basePrice,
      flavorCount,
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
  const freight = Math.max(toNumber(body.freight), 0);
  const total = round(subtotal - discount + tax + freight);

  if (total <= 0) {
    throw new ValidationError("Purchase total must be greater than zero");
  }

  // Initial payment is accepted only on create. Edits record payments through
  // the dedicated /payment endpoint so the existing ledger stays immutable.
  const paymentAmount = existingPurchase ? 0 : Math.max(toNumber(body.paymentAmount), 0);
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
        createdBy: cleanString(body.createdBy) || DEFAULT_RECEIVED_BY,
      }]
    : [];

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
        productFlavors: toPlainMap(supplier.productFlavors),
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
      createdBy: cleanString(body.createdBy) || DEFAULT_RECEIVED_BY,
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

function createReceiptEntry({ quantity, receivedQuantity, reference, notes, receivedAt, performedBy }) {
  return {
    quantity,
    receivedQuantity,
    reference,
    notes: cleanString(notes),
    receivedAt,
    performedBy: cleanString(performedBy) || DEFAULT_RECEIVED_BY,
  };
}

async function applyStockReceipt({
  compensations = [],
  productId,
  delta,
  flavors = [],
  itemName,
  unit,
  reference,
  notes,
  performedBy,
  partyName,
  session,
  productSnapshot = null,
}) {
  if (!delta || !mongoose.isValidObjectId(productId)) return null;

  const product =
    productSnapshot && productSnapshot._id
      ? productSnapshot
      : await Product.findById(productId)
          .select("title sku uom")
          .session(session)
          .lean();

  if (!product) {
    throw new ValidationError(`The product linked to ${itemName} no longer exists`);
  }

  const selectedFlavors = uniqueFlavors(flavors);
  const totalDelta = delta * (selectedFlavors.length || 1);
  const targetId = String(product._id || productId);
  const updatedProduct = await Product.findOneAndUpdate(
    { _id: targetId },
    { $inc: { openingStock: totalDelta } },
    { new: true, runValidators: true, session }
  );

  if (!updatedProduct) {
    throw new ValidationError(`The product linked to ${itemName} no longer exists`);
  }

  compensations.push(async () => {
    await Product.findByIdAndUpdate(
      targetId,
      { $inc: { openingStock: -totalDelta } },
      { session }
    );
  });

  if (selectedFlavors.length > 0) {
    await applyFlavorStockChanges({
      productId: targetId,
      flavors: selectedFlavors,
      delta,
      session,
      compensations,
    });
  }

  const newStock = Number(updatedProduct.openingStock) || 0;
  const [movement] = await StockMovement.create(
    [
      {
        product: targetId,
        sku: product.sku,
        productTitle: product.title,
        type: "purchase",
        direction: "in",
        quantity: totalDelta,
        previousStock: newStock - totalDelta,
        newStock,
        unit: product.uom || unit || "",
        reason: "Purchase goods receipt",
        reference,
        notes: cleanString(notes),
        performedBy: cleanString(performedBy) || DEFAULT_RECEIVED_BY,
        partyName: cleanString(partyName),
        flavor: selectedFlavors.length === 1 ? selectedFlavors[0] : "",
        flavorBreakdown: flavorBreakdown(selectedFlavors, delta),
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

async function getNextPurchaseCode(_req, res, next) {
  try {
    return res.status(200).json({ code: await generatePurchaseNumber() });
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

    const filter = supplierId ? { "supplier.id": supplierId } : {};
    const purchases = await Purchase.find(filter).sort({ purchaseDate: -1, createdAt: -1 });
    return res.status(200).json({ purchases });
  } catch (error) {
    return next(error);
  }
}

async function createPurchase(req, res, next) {
  try {
    const { changes, stockUpdates } = await buildPurchaseChanges(req.body || {});
    const purchase = await runWithSession(async (session, useTransaction) => {
      const compensations = [];
      let created;
      try {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            const [document] = await Purchase.create(
              [
                {
                  purchaseNumber: await generatePurchaseNumber(session),
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

        for (const update of stockUpdates) {
          await applyStockReceipt({
            compensations,
            productId: update.productId,
            delta: update.delta,
            flavors: update.flavors,
            itemName: update.itemName,
            unit: update.unit,
            reference: `${created.purchaseNumber} · ${STATUS_RECEIPT_REFERENCE}`,
            notes: STATUS_RECEIPT_NOTES,
            performedBy: changes.createdBy,
            partyName: changes.supplier.name,
            productSnapshot: update.product,
            session,
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
    const purchase = await findPurchase(req.params.id);
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
    const purchase = await findPurchase(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const { changes, stockUpdates } = await buildPurchaseChanges(req.body || {}, purchase);
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
            flavors: update.flavors,
            itemName: update.itemName,
            unit: update.unit,
            reference: `${purchase.purchaseNumber} · ${STATUS_RECEIPT_REFERENCE}`,
            notes: STATUS_RECEIPT_NOTES,
            performedBy: changes.createdBy,
            partyName: changes.supplier.name,
            productSnapshot: update.product,
            session,
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
    const purchase = await findPurchase(req.params.id);
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

    purchase.status = status;
    await purchase.save();
    return res.status(200).json({ message: "Purchase status updated", purchase });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function receivePurchase(req, res, next) {
  try {
    const purchase = await findPurchase(req.params.id);
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
    const performedBy = cleanString(req.body?.performedBy) || DEFAULT_RECEIVED_BY;
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

      updates.push({
        ...target,
        ordered,
        previousReceived,
        desired,
        delta: desired - previousReceived,
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
              $set: { [`${update.path}.receivedQuantity`]: update.desired },
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
                $set: { [`${update.path}.receivedQuantity`]: update.previousReceived },
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
            delta: update.delta,
            flavors: update.item.flavor || [],
            itemName: update.item.name,
            unit: update.item.unit,
            reference: `${purchase.purchaseNumber} · ${receiptReference}`,
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
    const purchase = await findPurchase(req.params.id);
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
      createdBy: cleanString(req.body?.createdBy) || "Tariq M. (Owner)",
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
    const purchase = await findPurchase(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    await runWithSession(async (session, useTransaction) => {
      const compensations = [];

      try {
        const references = new Set();
        for (const item of purchase.items) {
          const received = Math.max(0, Number(item.receivedQuantity) || 0);
          const productId = cleanString(item.productId);

          for (const receipt of item.receipts || []) {
            const reference = cleanString(receipt.reference);
            if (reference) {
              references.add(`${purchase.purchaseNumber} · ${reference}`);
            }
          }

          if (received === 0 || !mongoose.isValidObjectId(productId)) continue;

          const flavors = uniqueFlavors(item.flavor);
          const totalDelta = totalStockDelta(received, flavors);
          const product = await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { openingStock: -totalDelta } },
            { new: true, runValidators: true, session }
          );
          if (!product) {
            throw new ValidationError(
              `The product linked to ${item.name} no longer exists`
            );
          }

          compensations.push(async () => {
            await Product.findByIdAndUpdate(
              productId,
              { $inc: { openingStock: totalDelta } },
              { session }
            );
          });

          if (flavors.length > 0) {
            await applyFlavorStockChanges({
              productId,
              flavors,
              delta: -received,
              session,
              compensations,
            });
          }
        }

        if (references.size > 0) {
          const movementFilter = {
            type: "purchase",
            direction: "in",
            reference: { $in: Array.from(references) },
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
  createPurchase,
  updatePurchase,
  updatePurchaseStatus,
  receivePurchase,
  recordPurchasePayment,
  deletePurchase,
};
