const mongoose = require("mongoose");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const { tenantFilter, findOwned } = require("../utils/tenant");
const {
  applyFlavorStockChange,
  cleanFlavor,
} = require("../utils/flavor-stock");

function isTenantEnforced(req) {
  return req.tenantEnforced === true && Boolean(req.auth?.businessId);
}

function scopedFilter(req, extra = {}) {
  if (!isTenantEnforced(req)) return { ...extra };
  return tenantFilter(req, extra);
}

async function findOwnedProduct(id, req) {
  if (!isTenantEnforced(req)) return Product.findById(id);
  return findOwned(Product, id, req);
}

async function findOwnedMovement(id, req) {
  if (!isTenantEnforced(req)) return StockMovement.findById(id);
  return findOwned(StockMovement, id, req);
}

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

async function adjustStock(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const { direction, quantity, reason, reference, notes, performedBy } = req.body || {};

    if (direction !== "add" && direction !== "deduct") {
      return res.status(400).json({ message: "direction must be either 'add' or 'deduct'" });
    }

    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: "quantity must be a positive whole number" });
    }

    const current = await Product.findOne(scopedFilter(req, { _id: id })).lean();
    if (!current) {
      return res.status(404).json({ message: "Product not found" });
    }

    const requestedFlavor = cleanFlavor(req.body?.flavor);
    const flavorRows = Array.isArray(current.flavorStocks) ? current.flavorStocks : [];
    if (flavorRows.length > 0 && !requestedFlavor) {
      return res.status(400).json({ message: "Select a flavor to adjust this product" });
    }

    const matchingRow = requestedFlavor
      ? flavorRows.find(
          (row) => cleanFlavor(row.flavor).toLowerCase() === requestedFlavor.toLowerCase()
        )
      : null;
    const flavor = matchingRow ? matchingRow.flavor : requestedFlavor;

    const delta = direction === "add" ? qty : -qty;
    const filter = scopedFilter(req, { _id: id });
    if (direction === "deduct") {
      // Guard against concurrent deductions driving the balance below zero.
      filter.openingStock = { $gte: qty };
    }

    const compensations = [];
    const product = await Product.findOneAndUpdate(
      filter,
      { $inc: { openingStock: delta } },
      { new: true, runValidators: true }
    );

    if (!product) {
      const latest = await Product.findOne(scopedFilter(req, { _id: id })).lean();
      if (!latest) {
        return res.status(404).json({ message: "Product not found" });
      }
      return res.status(400).json({
        message: `Cannot deduct more than the available stock (${Number(
          latest.openingStock || 0
        )})`,
      });
    }

    compensations.push(async () => {
      await Product.findOneAndUpdate(scopedFilter(req, { _id: id }), {
        $inc: { openingStock: -delta },
      });
    });

    try {
      if (flavor) {
        await applyFlavorStockChange({
          productId: id,
          flavor,
          delta,
          compensations,
          businessId: isTenantEnforced(req) ? req.auth.businessId : null,
        });
      }
    } catch (error) {
      for (const compensate of compensations.reverse()) await compensate();
      throw error;
    }

    const newStock = Number(product.openingStock || 0);
    const previousStock = newStock - delta;

    let movement;
    try {
      movement = await StockMovement.create({
        product: product._id,
        sku: product.sku,
        productTitle: product.title,
        type: "adjustment",
        direction: direction === "add" ? "in" : "out",
        quantity: qty,
        previousStock,
        newStock,
        unit: product.uom || "",
        reason: cleanString(reason),
        reference: cleanString(reference),
        notes: cleanString(notes),
        performedBy: cleanString(performedBy) || "Admin",
        flavor,
        flavorBreakdown: flavor ? [{ flavor, quantity: qty }] : [],
        ...(isTenantEnforced(req)
          ? { businessId: req.auth.businessId, createdByUserId: req.auth.id }
          : {}),
      });
    } catch (movementError) {
      // Roll the stock change back so the ledger and stock balance never drift apart.
      for (const compensate of compensations.reverse()) {
        await compensate().catch((revertError) => {
          console.error("Failed to revert stock after movement error:", revertError.message);
        });
      }
      throw movementError;
    }

    return res.status(201).json({
      message: "Stock adjusted successfully",
      product: await Product.findOne(scopedFilter(req, { _id: id })),
      movement,
    });
  } catch (error) {
    return next(error);
  }
}

async function getMovements(req, res, next) {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 200)
      : 100;

    const filter = scopedFilter(req);
    const movements = await StockMovement.find(filter).sort({ createdAt: -1 }).limit(limit);
    return res.status(200).json({ movements });
  } catch (error) {
    return next(error);
  }
}

async function deleteStockMovement(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid movement id" });
    }

    const movement = await findOwnedMovement(id, req);
    if (!movement) {
      return res.status(404).json({ message: "Stock movement not found" });
    }
    if (movement.type !== "adjustment") {
      return res.status(400).json({ message: "Only stock adjustment entries can be deleted" });
    }

    // Removing an adjustment must also undo its effect on the product balance.
    const reversal = movement.direction === "in" ? -movement.quantity : movement.quantity;
    const filter = scopedFilter(req, { _id: movement.product });
    if (reversal < 0) {
      filter.openingStock = { $gte: movement.quantity };
    }

    const product = await Product.findOneAndUpdate(
      filter,
      { $inc: { openingStock: reversal } },
      { new: true, runValidators: true }
    );

    if (!product) {
      const current = await Product.findOne(scopedFilter(req, { _id: movement.product })).lean();
      if (!current) {
        return res.status(404).json({ message: "Linked product no longer exists" });
      }
      return res.status(400).json({
        message: `Cannot reverse this adjustment because only ${Number(
          current.openingStock || 0
        )} units remain in stock`,
      });
    }

    const compensations = [
      async () => {
        await Product.findOneAndUpdate(scopedFilter(req, { _id: movement.product }), {
          $inc: { openingStock: -reversal },
        });
      },
    ];

    try {
      const flavorEntries =
        Array.isArray(movement.flavorBreakdown) && movement.flavorBreakdown.length > 0
          ? movement.flavorBreakdown
          : cleanFlavor(movement.flavor)
            ? [{ flavor: movement.flavor, quantity: movement.quantity }]
            : [];

      for (const entry of flavorEntries) {
        await applyFlavorStockChange({
          productId: movement.product,
          flavor: entry.flavor,
          delta: reversal < 0 ? -Number(entry.quantity) : Number(entry.quantity),
          compensations,
          businessId: isTenantEnforced(req) ? req.auth.businessId : null,
        });
      }

      await StockMovement.findOneAndDelete(scopedFilter(req, { _id: id }));
    } catch (deleteError) {
      for (const compensate of compensations.reverse()) {
        await compensate().catch((revertError) => {
          console.error("Failed to revert stock after movement delete error:", revertError.message);
        });
      }
      throw deleteError;
    }

    return res.status(200).json({
      message: "Stock adjustment deleted",
      product: await Product.findOne(scopedFilter(req, { _id: movement.product })),
      movement,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { adjustStock, getMovements, deleteStockMovement };
