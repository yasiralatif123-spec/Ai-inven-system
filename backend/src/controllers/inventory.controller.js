const mongoose = require("mongoose");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const { tenantFilter, findOwned } = require("../utils/tenant");
const { runWithSession } = require("../utils/db");
const { resolveActorName } = require("../utils/actor");
const {
  normalizeUnit,
  toBasePiecesStrict,
  parseWholeQuantity,
  isSupportedUnit,
} = require("../utils/units");

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
  }
}

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

function handleControllerError(error, res, next) {
  if (error instanceof ConflictError || error?.code === 11000) {
    return res
      .status(409)
      .json({ message: "This stock movement was already reversed" });
  }
  return next(error);
}

async function rollback(compensations) {
  for (const compensate of [...compensations].reverse()) {
    try {
      await compensate();
    } catch (error) {
      console.error("Failed to compensate inventory change:", error.message);
    }
  }
}

async function adjustStock(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const { direction, quantity, unit, reason, reference, notes } = req.body || {};

    if (direction !== "add" && direction !== "deduct") {
      return res.status(400).json({ message: "direction must be either 'add' or 'deduct'" });
    }

    const qty = parseWholeQuantity(quantity);
    if (qty === null) {
      return res.status(400).json({ message: "quantity must be a positive whole number" });
    }

    const normalizedUnit = normalizeUnit(unit || "Piece");
    if (!normalizedUnit || !isSupportedUnit(normalizedUnit)) {
      return res.status(400).json({ message: "unit must be Carton, Box, or Piece" });
    }
    const baseQty = toBasePiecesStrict(qty, normalizedUnit);
    if (baseQty === null || baseQty <= 0) {
      return res.status(400).json({ message: "Invalid quantity/unit conversion" });
    }

    const delta = direction === "add" ? baseQty : -baseQty;
    const result = await runWithSession(async (session, useTransaction) => {
      const compensations = [];
      let product = null;
      let newStock = null;

      try {
        const filter = scopedFilter(req, { _id: id });
        if (direction === "deduct") {
          filter.openingStock = { $gte: baseQty };
        }

        product = await Product.findOneAndUpdate(
          filter,
          { $inc: { openingStock: delta } },
          { new: true, runValidators: true, session }
        );

        if (!product) {
          const latest = await Product.findOne(scopedFilter(req, { _id: id }))
            .session(session)
            .lean();
          if (!latest) {
            return { missing: true };
          }
          return { insufficient: true, available: Number(latest.openingStock || 0) };
        }

        newStock = Number(product.openingStock || 0);
        const previousStock = newStock - delta;
        compensations.push(async () => {
          await Product.findOneAndUpdate(
            scopedFilter(req, { _id: id, openingStock: newStock }),
            { $inc: { openingStock: -delta } },
            { session }
          );
        });

        const [movement] = await StockMovement.create(
          [
            {
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
              performedBy: resolveActorName(req),
              ...(isTenantEnforced(req)
                ? { businessId: req.auth.businessId, createdByUserId: req.auth.id }
                : {}),
            },
          ],
          { session }
        );

        compensations.push(async () => {
          await StockMovement.deleteOne({ _id: movement._id }, { session });
        });

        return { product, movement };
      } catch (error) {
        if (!useTransaction) await rollback(compensations);
        throw error;
      }
    });

    if (result.missing) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (result.insufficient) {
      return res.status(400).json({
        message: `Cannot deduct more than the available stock (${result.available} pieces)`,
      });
    }

    return res.status(201).json({
      message: "Stock adjusted successfully",
      product: await Product.findOne(scopedFilter(req, { _id: id })),
      movement: result.movement,
    });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function getMovements(req, res, next) {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 200)
      : 100;

    const movements = await StockMovement.find(scopedFilter(req))
      .sort({ createdAt: -1 })
      .limit(limit);
    return res.status(200).json({ movements });
  } catch (error) {
    return next(error);
  }
}

/**
 * Reverses an adjustment without mutating history. The original movement stays
 * in the ledger and a new movement with `reversesMovement` records the change.
 */
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
      return res.status(400).json({ message: "Only stock adjustment entries can be reversed" });
    }
    if (movement.reversesMovement) {
      return res
        .status(400)
        .json({ message: "A compensating movement cannot be reversed again" });
    }

    if (!Number.isSafeInteger(movement.quantity) || movement.quantity < 1) {
      return res.status(400).json({
        message: "Cannot reverse a legacy movement with a non-whole quantity",
      });
    }

    const reversal = movement.direction === "in" ? -movement.quantity : movement.quantity;
    const baseQuantity =
      Number.isSafeInteger(movement.baseQuantity) && movement.baseQuantity > 0
        ? movement.baseQuantity
        : movement.quantity;
    const result = await runWithSession(async (session, useTransaction) => {
      const compensations = [];
      let newStock = null;

      try {
        const existingReversal = await StockMovement.findOne(
          scopedFilter(req, { reversesMovement: movement._id })
        )
          .session(session)
          .lean();
        if (existingReversal) {
          return { alreadyReversed: true, reversal: existingReversal };
        }

        const filter = scopedFilter(req, { _id: movement.product });
        if (reversal < 0) {
          filter.openingStock = { $gte: baseQuantity };
        }

        const product = await Product.findOneAndUpdate(
          filter,
          { $inc: { openingStock: reversal } },
          { new: true, runValidators: true, session }
        );

        if (!product) {
          const current = await Product.findOne(
            scopedFilter(req, { _id: movement.product })
          )
            .session(session)
            .lean();
          if (!current) {
            return { missingProduct: true };
          }
          return {
            insufficient: true,
            available: Number(current.openingStock || 0),
          };
        }

        newStock = Number(product.openingStock || 0);
        compensations.push(async () => {
          await Product.findOneAndUpdate(
            scopedFilter(req, { _id: movement.product, openingStock: newStock }),
            { $inc: { openingStock: -reversal } },
            { session }
          );
        });

        const [compensatingMovement] = await StockMovement.create(
          [
            {
              product: movement.product,
              sku: movement.sku,
              productTitle: movement.productTitle,
              type: "adjustment",
              direction: reversal > 0 ? "in" : "out",
              quantity: baseQuantity,
              originalQuantity: movement.originalQuantity ?? baseQuantity,
              originalUnit: movement.originalUnit || movement.unit || "Piece",
              baseQuantity,
              previousStock: newStock - reversal,
              newStock,
              unit: movement.unit || movement.originalUnit || "Piece",
              reason: "Reversal of stock adjustment",
              reference: `${movement.reference || "ADJ"} - REVERSAL`,
              notes: `Compensates movement ${movement._id}; original record retained`,
              performedBy: resolveActorName(req),
              reversesMovement: movement._id,
              ...(isTenantEnforced(req)
                ? { businessId: req.auth.businessId, createdByUserId: req.auth.id }
                : {}),
            },
          ],
          { session }
        );

        compensations.push(async () => {
          await StockMovement.deleteOne({ _id: compensatingMovement._id }, { session });
        });

        return { product, reversal: compensatingMovement };
      } catch (error) {
        if (!useTransaction) await rollback(compensations);
        throw error;
      }
    });

    if (result.alreadyReversed) {
      return res.status(200).json({
        message: "Stock adjustment was already reversed",
        product: await Product.findOne(scopedFilter(req, { _id: movement.product })),
        movement,
        reversal: result.reversal,
      });
    }
    if (result.missingProduct) {
      return res.status(404).json({ message: "Linked product no longer exists" });
    }
    if (result.insufficient) {
      return res.status(400).json({
        message: `Cannot reverse this adjustment because only ${result.available} units remain in stock`,
      });
    }

    return res.status(200).json({
      message: "Stock adjustment reversed",
      product: await Product.findOne(scopedFilter(req, { _id: movement.product })),
      movement,
      reversal: result.reversal,
    });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

module.exports = { adjustStock, getMovements, deleteStockMovement };
