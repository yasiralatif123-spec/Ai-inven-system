const mongoose = require("mongoose");
const Product = require("../models/Product");
const { ensureCloudinaryConfigured } = require("../config/cloudinary");

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

function normalizeFlavors(value) {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,\n]/)
      : [];

  const seen = new Set();
  const flavors = [];
  for (const raw of rawValues) {
    const flavor = String(raw ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 80);
    if (!flavor) continue;

    const key = flavor.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    flavors.push(flavor);
    if (flavors.length >= 24) break;
  }
  return flavors;
}

async function createProduct(req, res, next) {
  try {
    const {
      title,
      sku,
      barcode,
      category,
      brand,
      description,
      flavors,
      purchasePrice,
      wholesalePrice,
      retailPrice,
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

    if (!title || !sku || !category || !brand) {
      return res.status(400).json({ message: "title, sku, category, and brand are required" });
    }

    const existing = await Product.findOne({ sku: String(sku).trim() });
    if (existing) {
      return res.status(409).json({ message: "A product with this SKU already exists" });
    }

    let imageUrl = "";
    let imagePublicId = "";
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const product = await Product.create({
      title: String(title).trim(),
      sku: String(sku).trim(),
      barcode: barcode ? String(barcode).trim() : "",
      category: String(category).trim(),
      brand: String(brand).trim(),
      description: description ? String(description).trim() : "",
      flavors: normalizeFlavors(flavors),
      purchasePrice: toNumber(purchasePrice),
      wholesalePrice: toNumber(wholesalePrice),
      retailPrice: toNumber(retailPrice),
      taxBracket: taxBracket ? String(taxBracket).trim() : "",
      uom: uom ? String(uom).trim() : "",
      openingStock: toNumber(openingStock),
      reorderThreshold: toNumber(reorderThreshold),
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
    });

    return res.status(201).json({ message: "Product created", product });
  } catch (error) {
    return next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json({ products });
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      title,
      sku,
      barcode,
      category,
      brand,
      description,
      flavors,
      purchasePrice,
      wholesalePrice,
      retailPrice,
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

    if (!title || !sku || !category || !brand) {
      return res.status(400).json({ message: "title, sku, category, and brand are required" });
    }

    const normalizedSku = String(sku).trim();
    const existing = await Product.findOne({ sku: normalizedSku, _id: { $ne: product._id } });
    if (existing) {
      return res.status(409).json({ message: "A product with this SKU already exists" });
    }

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
    product.brand = String(brand).trim();
    product.description = description ? String(description).trim() : "";
    product.flavors = normalizeFlavors(flavors);
    product.purchasePrice = toNumber(purchasePrice);
    product.wholesalePrice = toNumber(wholesalePrice);
    product.retailPrice = toNumber(retailPrice);
    product.taxBracket = taxBracket ? String(taxBracket).trim() : "";
    product.uom = uom ? String(uom).trim() : "";
    product.openingStock = toNumber(openingStock);
    product.reorderThreshold = toNumber(reorderThreshold);
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
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const publicId = product.imagePublicId || "";
    await product.deleteOne();

    // Delete the Cloudinary image only after the database record is gone.
    await destroyCloudinaryImage(publicId);

    return res.status(200).json({ message: "Product deleted", id });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createProduct, getProducts, updateProduct, deleteProduct };