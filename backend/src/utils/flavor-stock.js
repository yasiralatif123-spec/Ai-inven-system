const Product = require("../models/Product");

class FlavorStockError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

function cleanFlavor(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function uniqueFlavors(values) {
  const seen = new Set();
  const result = [];

  (Array.isArray(values) ? values : []).forEach((value) => {
    const flavor = cleanFlavor(value);
    if (!flavor) return;
    const key = flavor.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(flavor);
  });

  return result;
}

/**
 * A purchase/sale quantity applies in full to every selected flavor, matching
 * the existing `base × flavorCount × quantity` pricing rule.
 */
function totalStockDelta(quantity, flavors) {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  const selected = uniqueFlavors(flavors);
  return qty * (selected.length || 1);
}

function flavorBreakdown(flavors, quantityPerFlavor) {
  const qty = Math.abs(Math.floor(Number(quantityPerFlavor) || 0));
  if (qty <= 0) return [];

  return uniqueFlavors(flavors).map((flavor) => ({ flavor, quantity: qty }));
}

function findFlavorEntry(entries, flavor) {
  const key = cleanFlavor(flavor).toLowerCase();
  return (entries || []).find(
    (entry) => cleanFlavor(entry?.flavor).toLowerCase() === key
  );
}

/**
 * Applies one flavor's stock delta to the embedded Product.flavorStocks array.
 * The product-level openingStock is updated separately by the caller so both
 * changes can share the caller's session/compensation stack.
 */
async function applyFlavorStockChange({
  productId,
  flavor,
  delta,
  session,
  compensations = [],
  businessId = null,
}) {
  const name = cleanFlavor(flavor);
  if (!name || !Number.isFinite(delta) || delta === 0) return null;

  const scope = businessId ? { _id: productId, businessId } : { _id: productId };
  const query = Product.findOne(scope);
  if (session) query.session(session);
  const product = await query;
  if (!product) {
    throw new FlavorStockError("The product linked to this line no longer exists");
  }

  const entries = Array.isArray(product.flavorStocks) ? product.flavorStocks : [];
  const entry = findFlavorEntry(entries, name);
  const previous = entry ? Number(entry.quantity) || 0 : 0;
  const next = previous + delta;

  if (next < 0) {
    throw new FlavorStockError(
      `Insufficient stock for ${name}. Available: ${previous}, requested: ${Math.abs(delta)}`
    );
  }

  if (entry) {
    entry.quantity = next;
  } else {
    entries.push({ flavor: name, quantity: next });
  }
  product.flavorStocks = entries;
  await product.save({ session });

  compensations.push(async () => {
    const compensationQuery = Product.findOne(scope);
    if (session) compensationQuery.session(session);
    const current = await compensationQuery;
    if (!current) return;
    const target = findFlavorEntry(current.flavorStocks, name);
    if (!target) return;
    target.quantity = previous;
    await current.save({ session });
  });

  return { flavor: name, previous, next };
}

async function applyFlavorStockChanges({
  productId,
  flavors,
  delta,
  session,
  compensations = [],
  businessId = null,
}) {
  const results = [];
  for (const flavor of uniqueFlavors(flavors)) {
    const result = await applyFlavorStockChange({
      productId,
      flavor,
      delta,
      session,
      compensations,
      businessId,
    });
    if (result) results.push(result);
  }
  return results;
}

module.exports = {
  FlavorStockError,
  cleanFlavor,
  uniqueFlavors,
  totalStockDelta,
  flavorBreakdown,
  applyFlavorStockChange,
  applyFlavorStockChanges,
};
