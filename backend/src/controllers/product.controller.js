const mongoose = require("mongoose");
const Product = require("../models/Product");
const Brand = require("../models/Brand");
const StockMovement = require("../models/StockMovement");
const { ensureCloudinaryConfigured } = require("../config/cloudinary");
const { tenantFilter, findOwned } = require("../utils/tenant");
const { runWithSession } = require("../utils/db");
const { resolveActorName, DEFAULT_ACTOR_NAME } = require("../utils/actor");
const {
  normalizeUnit,
  isSupportedUnit,
  parseCanonicalPrice,
  parseMoneyInput,
  parseWholeQuantity,
  pricePerPiece,
} = require("../utils/units");

function uploadBufferToCloudinary(buffer, folder = "inv_system/products") {
  const cloudinary = ensureCloudinaryConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function destroyCloudinaryImage(publicId) {
  if (!publicId) return;
  try {
    const cloudinary = ensureCloudinaryConfigured();
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Do not fail the product operation if Cloudinary cleanup fails.
    console.error(`Failed to delete Cloudinary image ${publicId}:`, error.message);
  }
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "on" || value === "1";
  return Boolean(value);
}

class ProductValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProductValidationError";
  }
}

function resolveProductUom(value) {
  if (value === undefined || value === null || String(value).trim() === "") return "Piece";
  const normalized = normalizeUnit(value);
  if (!normalized || !isSupportedUnit(normalized)) {
    throw new ProductValidationError("uom must be Piece, Box, or Carton");
  }
  return normalized;
}

function canonicalPriceFromBody(body, field) {
  const flatKey = `canonical${field[0].toUpperCase()}${field.slice(1)}`;
  if (body[flatKey] !== undefined) return body[flatKey];

  const nested = body.canonicalPrices;
  if (nested && typeof nested === "object" && Object.prototype.hasOwnProperty.call(nested, field)) {
    return nested[field];
  }

  return undefined;
}

function resolvePricing(body) {
  const priceUnit = normalizeUnit(body.priceUnit ?? "Piece");
  if (!priceUnit || !isSupportedUnit(priceUnit)) {
    throw new ProductValidationError("priceUnit must be Piece, Box, or Carton");
  }

  const fields = ["purchasePrice", "wholesalePrice", "retailPrice"];
  const canonical = {};
  for (const field of fields) {
    const suppliedCanonical = canonicalPriceFromBody(body, field);
    let perPiece;

    if (suppliedCanonical !== undefined) {
      // Canonical prices from the form are authoritative. Display strings can
      // be rounded for smaller units, so converting them back would lose data.
      perPiece = parseCanonicalPrice(suppliedCanonical);
      if (perPiece === null) {
        throw new ProductValidationError(
          `${field} canonical price must be a finite, non-negative number`
        );
      }
    } else {
      // Legacy clients still send display prices plus priceUnit.
      const amount = parseMoneyInput(body[field]);
      if (amount === null) {
        throw new ProductValidationError(`${field} must be a finite, non-negative number`);
      }
      perPiece = pricePerPiece(amount, priceUnit);
      if (perPiece === null) {
        throw new ProductValidationError(`${field} could not be converted per Piece`);
      }
    }

    canonical[field] = perPiece;
  }

  return { priceUnit, ...canonical };
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
  }
}

function parseStockValue(value, { required = false, label = "Opening stock" } = {}) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return required ? null : 0;
  }
  const parsed = parseWholeQuantity(value, { allowZero: true });
  if (parsed === null) {
    throw new ProductValidationError(`${label} must be a non-negative whole number`);
  }
  return parsed;
}

function buildProductMovement({
  product,
  delta,
  previousStock,
  newStock,
  reason,
  reference,
  notes,
  req,
  type = "adjustment",
  reversesMovement = null,
}) {
  const quantity = Math.abs(delta);
  if (!Number.isSafeInteger(quantity) || quantity < 1) return null;

  const actor = resolveActorName(req) || DEFAULT_ACTOR_NAME;
  return {
    product: product._id,
    sku: product.sku,
    productTitle: product.title,
    type,
    direction: delta > 0 ? "in" : "out",
    quantity,
    originalQuantity: quantity,
    originalUnit: "Piece",
    baseQuantity: quantity,
    previousStock,
    newStock,
    unit: "Piece",
    reason,
    reference,
    notes,
    performedBy: actor,
    reversesMovement,
    ...(isTenantEnforced(req)
      ? { businessId: req.auth.businessId, createdByUserId: req.auth.id }
      : {}),
  };
}

function handleControllerError(error, res, next) {
  if (error instanceof ProductValidationError) {
    return res.status(400).json({ message: error.message });
  }
  if (error instanceof ConflictError) {
    return res.status(409).json({ message: error.message });
  }
  return next(error);
}

function isTenantEnforced(req) {
  return req.tenantEnforced === true && Boolean(req.auth?.businessId);
}

function productFilter(req, extra = {}) {
  if (!isTenantEnforced(req)) return { ...extra };
  return tenantFilter(req, extra);
}

async function findOwnedProduct(id, req) {
  if (!isTenantEnforced(req)) return Product.findById(id);
  return findOwned(Product, id, req);
}

function normalizeBrandText(value) {
  return value === undefined || value === null
    ? ""
    : String(value).trim().replace(/\s+/g, " ");
}

async function resolveProductBrand(req, brandId, legacyBrand, existing = null) {
  // An omitted field preserves an existing relationship instead of silently
  // clearing it. An explicit empty string means "remove the brand link".
  if (brandId === undefined) {
    if (existing?.brandId) {
      return { brandId: existing.brandId, brand: existing.brand || "" };
    }
    return { brandId: null, brand: normalizeBrandText(legacyBrand) };
  }

  const rawBrandId = brandId === null ? "" : String(brandId).trim();
  if (!rawBrandId) {
    return { brandId: null, brand: normalizeBrandText(legacyBrand) };
  }

  if (!mongoose.isValidObjectId(rawBrandId)) {
    throw new ProductValidationError("Selected brand is invalid or inactive");
  }

  const brand = await Brand.findOne(productFilter(req, { _id: rawBrandId }));
  if (!brand) {
    throw new ProductValidationError("Selected brand is invalid or inactive");
  }

  // Inactive brands cannot be chosen for new products, but an existing product
  // may keep its current inactive brand so historical records remain intact.
  const isCurrentBrand = Boolean(existing?.brandId && String(existing.brandId) === String(brand._id));
  if (brand.isActive === false && !isCurrentBrand) {
    throw new ProductValidationError("Selected brand is invalid or inactive");
  }

  return { brandId: brand._id, brand: brand.name };
}

async function createProduct(req, res, next) {
  try {
    const {
      title,
      sku,
      barcode,
      category,
      brand,
      brandId,
      description,
      uom,
      openingStock,
      reorderThreshold,
      warehouse,
      rackBay,
      catalogStatus,
      batchTracking,
      expiryDate,
      climateControlled,
      eligibleForReturn,
      halalPsqcaCertified,
    } = req.body;

    if (!title || !sku || !category) {
      return res.status(400).json({ message: "title, sku, and category are required" });
    }

    const brandRef = await resolveProductBrand(req, brandId, brand);
    const normalizedSku = String(sku).trim();
    const existingSkuFilter = isTenantEnforced(req)
      ? { sku: normalizedSku, businessId: req.auth.businessId }
      : { sku: normalizedSku };
    const existing = await Product.findOne(existingSkuFilter);
    if (existing) {
      return res.status(409).json({ message: "A product with this SKU already exists" });
    }

    if (
      reorderThreshold === undefined ||
      reorderThreshold === null ||
      String(reorderThreshold).trim() === ""
    ) {
      return res.status(400).json({ message: "Reorder alert threshold is required" });
    }
    const reorderThresholdNum = Number(reorderThreshold);
    if (!Number.isFinite(reorderThresholdNum) || reorderThresholdNum < 0) {
      return res
        .status(400)
        .json({ message: "Reorder alert threshold must be 0 or greater" });
    }

    const pricing = resolvePricing(req.body);
    const normalizedUom = resolveProductUom(uom);

    let imageUrl = "";
    let imagePublicId = "";
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const openingStockPieces = parseStockValue(openingStock);
    const productData = {
      title: String(title).trim(),
      sku: normalizedSku,
      barcode: barcode ? String(barcode).trim() : "",
      category: String(category).trim(),
      brand: brandRef.brand,
      brandId: brandRef.brandId,
      description: description ? String(description).trim() : "",
      purchasePrice: pricing.purchasePrice,
      wholesalePrice: pricing.wholesalePrice,
      retailPrice: pricing.retailPrice,
      priceUnit: pricing.priceUnit,
      uom: normalizedUom,
      openingStock: openingStockPieces,
      reorderThreshold: reorderThresholdNum,
      warehouse: warehouse ? String(warehouse).trim() : "",
      rackBay: rackBay ? String(rackBay).trim() : "",
      catalogStatus: catalogStatus || "active",
      batchTracking: toBoolean(batchTracking),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      climateControlled: toBoolean(climateControlled),
      eligibleForReturn: toBoolean(eligibleForReturn),
      halalPsqcaCertified: toBoolean(halalPsqcaCertified),
      imageUrl,
      imagePublicId,
      // Tenant boundary: always from auth context, never from request body.
      ...(isTenantEnforced(req)
        ? { businessId: req.auth.businessId, createdByUserId: req.auth.id }
        : {}),
    };

    let product;
    try {
      product = await runWithSession(async (session, useTransaction) => {
        let created;
        const compensations = [];

        try {
          const [document] = await Product.create([productData], { session });
          created = document;

          if (openingStockPieces > 0) {
            const movementData = buildProductMovement({
              product: created,
              delta: openingStockPieces,
              previousStock: 0,
              newStock: openingStockPieces,
              reason: "Opening stock on product creation",
              reference: `PRODUCT-CREATE-${created.sku}`,
              notes: "Initial stock recorded as an immutable adjustment",
              req,
            });
            const [movement] = await StockMovement.create([movementData], { session });
            compensations.push(async () => {
              await StockMovement.deleteOne({ _id: movement._id }, { session });
            });
          }

          return created;
        } catch (error) {
          if (!useTransaction) {
            for (const compensate of [...compensations].reverse()) {
              try {
                await compensate();
              } catch (compensationError) {
                console.error(
                  "Failed to compensate product creation:",
                  compensationError.message
                );
              }
            }
            if (created) {
              await Product.deleteOne({ _id: created._id }, { session }).catch(() => {});
            }
          }
          throw error;
        }
      });
    } catch (error) {
      if (imagePublicId) {
        await destroyCloudinaryImage(imagePublicId).catch(() => {});
      }
      throw error;
    }

    return res.status(201).json({ message: "Product created", product });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function getProducts(req, res, next) {
  try {
    const filter = productFilter(req);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ products });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const product = await findOwnedProduct(id, req);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json({ product });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function getProductBySku(req, res, next) {
  try {
    const sku = typeof req.params.sku === "string" ? req.params.sku.trim() : "";
    if (!sku) {
      return res.status(400).json({ message: "sku is required" });
    }
    const filter = productFilter(req, { sku });
    const product = await Product.findOne(filter);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json({ product });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await findOwnedProduct(id, req);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      title,
      sku,
      barcode,
      category,
      brand,
      brandId,
      description,
      uom,
      openingStock,
      reorderThreshold,
      warehouse,
      rackBay,
      catalogStatus,
      batchTracking,
      expiryDate,
      removeImage,
    } = req.body;

    if (!title || !sku || !category) {
      return res.status(400).json({ message: "title, sku, and category are required" });
    }

    const normalizedSku = String(sku).trim();
    const existingSkuFilter = isTenantEnforced(req)
      ? { sku: normalizedSku, businessId: req.auth.businessId, _id: { $ne: product._id } }
      : { sku: normalizedSku, _id: { $ne: product._id } };
    const existing = await Product.findOne(existingSkuFilter);
    if (existing) {
      return res.status(409).json({ message: "A product with this SKU already exists" });
    }

    const brandRef = await resolveProductBrand(req, brandId, brand, product);

    if (
      reorderThreshold === undefined ||
      reorderThreshold === null ||
      String(reorderThreshold).trim() === ""
    ) {
      return res.status(400).json({ message: "Reorder alert threshold is required" });
    }
    const reorderThresholdNum = Number(reorderThreshold);
    if (!Number.isFinite(reorderThresholdNum) || reorderThresholdNum < 0) {
      return res
        .status(400)
        .json({ message: "Reorder alert threshold must be 0 or greater" });
    }

    const pricing = resolvePricing(req.body);
    const normalizedUom = resolveProductUom(uom);
    const desiredStock = parseStockValue(openingStock);

    const previousPublicId = product.imagePublicId || "";
    const shouldRemoveImage = String(removeImage).toLowerCase() === "true";
    let uploadedImage = null;
    let nextImageUrl = product.imageUrl || "";
    let nextImagePublicId = product.imagePublicId || "";

    if (req.file && req.file.buffer) {
      uploadedImage = await uploadBufferToCloudinary(req.file.buffer);
      nextImageUrl = uploadedImage.secure_url;
      nextImagePublicId = uploadedImage.public_id;
    } else if (shouldRemoveImage) {
      nextImageUrl = "";
      nextImagePublicId = "";
    }

    const nextFields = {
      title: String(title).trim(),
      sku: normalizedSku,
      barcode: barcode ? String(barcode).trim() : "",
      category: String(category).trim(),
      brand: brandRef.brand,
      brandId: brandRef.brandId,
      description: description ? String(description).trim() : "",
      purchasePrice: pricing.purchasePrice,
      wholesalePrice: pricing.wholesalePrice,
      retailPrice: pricing.retailPrice,
      priceUnit: pricing.priceUnit,
      uom: normalizedUom,
      reorderThreshold: reorderThresholdNum,
      warehouse: warehouse ? String(warehouse).trim() : "",
      rackBay: rackBay ? String(rackBay).trim() : "",
      catalogStatus: catalogStatus || "active",
      batchTracking: toBoolean(batchTracking),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      imageUrl: nextImageUrl,
      imagePublicId: nextImagePublicId,
    };
    const previousFields = {};
    for (const key of Object.keys(nextFields)) {
      previousFields[key] = product[key];
    }

    const previousStock = Number(product.openingStock) || 0;
    const stockDelta = desiredStock - previousStock;
    const expectedVersion = Number(product.__v) || 0;
    const imageChanged = Boolean(uploadedImage) || shouldRemoveImage;

    let saved;
    try {
      saved = await runWithSession(async (session, useTransaction) => {
        const compensations = [];
        let documentUpdated = false;

        try {
          const updated = await Product.findOneAndUpdate(
            productFilter(req, {
              _id: product._id,
              __v: expectedVersion,
              openingStock: previousStock,
            }),
            {
              $set: { ...nextFields, openingStock: desiredStock },
              $inc: { __v: 1 },
            },
            { new: true, runValidators: true, session }
          );

          if (!updated) {
            throw new ConflictError(
              "This product changed while it was being edited. Refresh and try again."
            );
          }
          documentUpdated = true;

          if (stockDelta !== 0) {
            const movementData = buildProductMovement({
              product: updated,
              delta: stockDelta,
              previousStock,
              newStock: desiredStock,
              reason:
                stockDelta > 0
                  ? "Opening stock increased by product edit"
                  : "Opening stock reduced by product edit",
              reference: `PRODUCT-EDIT-${updated.sku}`,
              notes: "Stock correction recorded during product edit",
              req,
            });
            const [movement] = await StockMovement.create([movementData], { session });
            compensations.push(async () => {
              await StockMovement.deleteOne({ _id: movement._id }, { session });
            });
          }

          return updated;
        } catch (error) {
          if (!useTransaction) {
            for (const compensate of [...compensations].reverse()) {
              try {
                await compensate();
              } catch (compensationError) {
                console.error(
                  "Failed to compensate product edit:",
                  compensationError.message
                );
              }
            }
            if (documentUpdated) {
              await Product.findOneAndUpdate(
                productFilter(req, {
                  _id: product._id,
                  __v: expectedVersion + 1,
                  openingStock: desiredStock,
                }),
                {
                  $set: { ...previousFields, openingStock: previousStock },
                  $inc: { __v: -1 },
                },
                { session }
              ).catch(() => {});
            }
          }
          throw error;
        }
      });
    } catch (error) {
      // Avoid leaving an orphaned newly uploaded image if the DB write fails.
      if (uploadedImage && uploadedImage.public_id) {
        await destroyCloudinaryImage(uploadedImage.public_id);
      }
      throw error;
    }

    if (imageChanged && previousPublicId && previousPublicId !== saved.imagePublicId) {
      await destroyCloudinaryImage(previousPublicId);
    }

    return res.status(200).json({ message: "Product updated", product: saved });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await findOwnedProduct(id, req);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const publicId = product.imagePublicId || "";
    const remainingStock = Number(product.openingStock) || 0;
    const expectedVersion = Number(product.__v) || 0;

    await runWithSession(async (session, useTransaction) => {
      const compensations = [];
      let stockCleared = false;

      try {
        if (remainingStock > 0) {
          const cleared = await Product.findOneAndUpdate(
            productFilter(req, {
              _id: product._id,
              __v: expectedVersion,
              openingStock: remainingStock,
            }),
            { $set: { openingStock: 0 }, $inc: { __v: 1 } },
            { new: true, runValidators: true, session }
          );
          if (!cleared) {
            throw new ConflictError(
              "This product changed while it was being deleted. Refresh and try again."
            );
          }
          stockCleared = true;

          const movementData = buildProductMovement({
            product: product,
            delta: -remainingStock,
            previousStock: remainingStock,
            newStock: 0,
            reason: "Remaining stock written off on product deletion",
            reference: `PRODUCT-DELETE-${product.sku}`,
            notes: "Product record removed; stock ledger entry preserved",
            req,
            type: "writeoff",
          });
          const [movement] = await StockMovement.create([movementData], { session });
          compensations.push(async () => {
            await StockMovement.deleteOne({ _id: movement._id }, { session });
          });
        }

        const deleted = await Product.deleteOne(
          productFilter(req, { _id: product._id, openingStock: 0 }),
          { session }
        );
        if (deleted.deletedCount !== 1) {
          throw new ConflictError(
            "This product changed while it was being deleted. Refresh and try again."
          );
        }
      } catch (error) {
        if (!useTransaction) {
          for (const compensate of [...compensations].reverse()) {
            try {
              await compensate();
            } catch (compensationError) {
              console.error(
                "Failed to compensate product deletion:",
                compensationError.message
              );
            }
          }
          if (stockCleared) {
            await Product.findOneAndUpdate(
              productFilter(req, {
                _id: product._id,
                __v: expectedVersion + 1,
                openingStock: 0,
              }),
              { $set: { openingStock: remainingStock }, $inc: { __v: -1 } },
              { session }
            ).catch(() => {});
          }
        }
        throw error;
      }
    });

    // Delete the Cloudinary image only after the database record is gone.
    await destroyCloudinaryImage(publicId);

    return res.status(200).json({ message: "Product deleted", id });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct,
};