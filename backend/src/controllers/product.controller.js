const mongoose = require("mongoose");
const Product = require("../models/Product");
const Brand = require("../models/Brand");
const { ensureCloudinaryConfigured } = require("../config/cloudinary");
const { tenantFilter, findOwned } = require("../utils/tenant");
const {
  normalizeUnit,
  isSupportedUnit,
  parseMoneyInput,
  pricePerPiece,
  roundMoney,
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

function resolvePricing(body) {
  const priceUnit = normalizeUnit(body.priceUnit ?? "Piece");
  if (!priceUnit || !isSupportedUnit(priceUnit)) {
    throw new ProductValidationError("priceUnit must be Piece, Box, or Carton");
  }

  const fields = ["purchasePrice", "wholesalePrice", "retailPrice"];
  const canonical = {};
  for (const field of fields) {
    const amount = parseMoneyInput(body[field]);
    if (amount === null) {
      throw new ProductValidationError(`${field} must be a finite, non-negative number`);
    }
    const perPiece = pricePerPiece(amount, priceUnit);
    if (perPiece === null) {
      throw new ProductValidationError(`${field} could not be converted per Piece`);
    }
    canonical[field] = roundMoney(perPiece);
  }

  return { priceUnit, ...canonical };
}

function handleControllerError(error, res, next) {
  if (error instanceof ProductValidationError) {
    return res.status(400).json({ message: error.message });
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
      taxBracket,
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

    const product = await Product.create({
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
      taxBracket: taxBracket ? String(taxBracket).trim() : "",
      uom: normalizedUom,
      openingStock: toNumber(openingStock),
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
    });

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
      taxBracket,
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

    const previousPublicId = product.imagePublicId || "";
    const shouldRemoveImage = String(removeImage).toLowerCase() === "true";
    let uploadedImage = null;

    if (req.file && req.file.buffer) {
      uploadedImage = await uploadBufferToCloudinary(req.file.buffer);
      product.imageUrl = uploadedImage.secure_url;
      product.imagePublicId = uploadedImage.public_id;
    } else if (shouldRemoveImage) {
      product.imageUrl = "";
      product.imagePublicId = "";
    }

    product.title = String(title).trim();
    product.sku = normalizedSku;
    product.barcode = barcode ? String(barcode).trim() : "";
    product.category = String(category).trim();
    product.brand = brandRef.brand;
    product.brandId = brandRef.brandId;
    product.description = description ? String(description).trim() : "";
    product.purchasePrice = pricing.purchasePrice;
    product.wholesalePrice = pricing.wholesalePrice;
    product.retailPrice = pricing.retailPrice;
    product.priceUnit = pricing.priceUnit;
    product.taxBracket = taxBracket ? String(taxBracket).trim() : "";
    product.uom = normalizedUom;
    product.openingStock = toNumber(openingStock);
    product.reorderThreshold = reorderThresholdNum;
    product.warehouse = warehouse ? String(warehouse).trim() : "";
    product.rackBay = rackBay ? String(rackBay).trim() : "";
    product.catalogStatus = catalogStatus || "active";
    product.batchTracking = toBoolean(batchTracking);
    product.expiryDate = expiryDate ? new Date(expiryDate) : null;

    try {
      await product.save();
    } catch (saveError) {
      // Avoid leaving an orphaned newly uploaded image if the DB write fails.
      if (uploadedImage && uploadedImage.public_id) {
        await destroyCloudinaryImage(uploadedImage.public_id);
      }
      throw saveError;
    }

    const imageChanged = Boolean(uploadedImage) || shouldRemoveImage;
    if (imageChanged && previousPublicId && previousPublicId !== product.imagePublicId) {
      await destroyCloudinaryImage(previousPublicId);
    }

    return res.status(200).json({ message: "Product updated", product });
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
    await product.deleteOne();

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