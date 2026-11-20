const mongoose = require("mongoose");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");

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

    const delta = direction === "add" ? qty : -qty;
    const filter = { _id: id };
    if (direction === "deduct") {
      // Guard against concurrent deductions driving the balance below zero.
      filter.openingStock = { $gte: qty };
    }

    const product = await Product.findOneAndUpdate(
      filter,
      { $inc: { openingStock: delta } },
      { new: true, runValidators: true }
    );

    if (!product) {
      const current = await Product.findById(id).lean();
      if (!current) {
        return res.status(404).json({ message: "Product not found" });
      }
      return res.status(400).json({
        message: `Cannot deduct more than the available stock (${Number(
          current.openingStock || 0
        )})`,
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
        quantity: qty,
        previousStock,
        newStock,
        unit: product.uom || "",
        reason: cleanString(reason),
        reference: cleanString(reference),
        notes: cleanString(notes),
        performedBy: cleanString(performedBy) || "Admin",
      });
    } catch (movementError) {
      // Roll the stock change back so the ledger and stock balance never drift apart.
      await Product.findByIdAndUpdate(id, { $inc: { openingStock: -delta } }).catch((revertError) => {
        console.error("Failed to revert stock after movement error:", revertError.message);
      });
      throw movementError;
    }

    return res.status(201).json({
      message: "Stock adjusted successfully",
      product,
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

    const movements = await StockMovement.find().sort({ createdAt: -1 }).limit(limit);
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

    const movement = await StockMovement.findById(id);
    if (!movement) {
      return res.status(404).json({ message: "Stock movement not found" });
    }
    if (movement.type !== "adjustment") {
      return res.status(400).json({ message: "Only stock adjustment entries can be deleted" });
    }

    // Removing an adjustment must also undo its effect on the product balance.
    const reversal = movement.direction === "in" ? -movement.quantity : movement.quantity;
    const filter = { _id: movement.product };
    if (reversal < 0) {
      filter.openingStock = { $gte: movement.quantity };
    }

    const product = await Product.findOneAndUpdate(
      filter,
      { $inc: { openingStock: reversal } },
      { new: true, runValidators: true }
    );

    if (!product) {
      const current = await Product.findById(movement.product).lean();
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
      await StockMovement.findByIdAndDelete(id);
    } catch (deleteError) {
      await Product.findByIdAndUpdate(movement.product, {
        $inc: { openingStock: -reversal },
      }).catch((revertError) => {
        console.error("Failed to revert stock after movement delete error:", revertError.message);
      });
      throw deleteError;
    }

    return res.status(200).json({
      message: "Stock adjustment deleted",
      product,
      movement,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { adjustStock, getMovements, deleteStockMovement };
