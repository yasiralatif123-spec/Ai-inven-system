const mongoose = require("mongoose");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const { tenantFilter, findOwned } = require("../utils/tenant");
const { normalizeUnit, toBasePieces, isSupportedUnit } = require("../utils/units");

function isTenantEnforced(req) {
  return req.tenantEnforced === true && Boolean(req.auth?.businessId);
}

function scopedFilter(req, extra = {}) {
  if (!isTenantEnforced(req)) return { ...extra };
  return tenantFilter(req, extra);
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

    const { direction, quantity, unit, reason, reference, notes, performedBy } = req.body || {};

    if (direction !== "add" && direction !== "deduct") {
      return res.status(400).json({ message: "direction must be either 'add' or 'deduct'" });
    }

    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: "quantity must be a positive whole number" });
    }

    const normalizedUnit = normalizeUnit(unit || "Piece");
    if (!normalizedUnit || !isSupportedUnit(normalizedUnit)) {
      return res.status(400).json({ message: "unit must be Carton, Box, or Piece" });
    }
    const baseQty = toBasePieces(qty, normalizedUnit);
    if (!Number.isFinite(baseQty) || baseQty <= 0) {
      return res.status(400).json({ message: "Invalid quantity/unit conversion" });
    }

    const delta = direction === "add" ? baseQty : -baseQty;
    const filter = scopedFilter(req, { _id: id });
    if (direction === "deduct") {
      filter.openingStock = { $gte: baseQty };
    }

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
        message: `Cannot deduct more than the available stock (${Number(latest.openingStock || 0)} pieces)`,
      });
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
        quantity: baseQty,
        originalQuantity: qty,
        originalUnit: normalizedUnit,
        baseQuantity: baseQty,
        previousStock,
        newStock,
        unit: normalizedUnit,
        reason: cleanString(reason),
        reference: cleanString(reference),
        notes: cleanString(notes),
        performedBy: cleanString(performedBy) || "Admin",
        ...(isTenantEnforced(req)
          ? { businessId: req.auth.businessId, createdByUserId: req.auth.id }
          : {}),
      });
    } catch (movementError) {
      await Product.findOneAndUpdate(scopedFilter(req, { _id: id }), {
        $inc: { openingStock: -delta },
      }).catch((revertError) => {
        console.error("Failed to revert stock after movement error:", revertError.message);
      });
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

    try {
      await StockMovement.findOneAndDelete(scopedFilter(req, { _id: id }));
    } catch (deleteError) {
      await Product.findOneAndUpdate(scopedFilter(req, { _id: movement.product }), {
        $inc: { openingStock: -reversal },
      }).catch((revertError) => {
        console.error("Failed to revert stock after movement delete error:", revertError.message);
      });
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
