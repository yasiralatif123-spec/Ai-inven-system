const mongoose = require("mongoose");
const Brand = require("../models/Brand");
const Product = require("../models/Product");
const { tenantFilter, findOwned } = require("../utils/tenant");

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

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function normalizeName(value) {
  return cleanString(value).replace(/\s+/g, " ");
}

function normalizedKey(value) {
  return normalizeName(value).toLowerCase();
}

function escapeRegex(value) {
  // User input is treated as literal text, not as a regular expression.
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePositiveInt(value, name, min, max) {
  const normalized = String(value ?? "").trim();
  if (!/^\d+$/.test(normalized)) {
    throw new ValidationError(`${name} must be a whole number`);
  }
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new ValidationError(`${name} must be between ${min} and ${max}`);
  }
  return parsed;
}

function isTenantEnforced(req) {
  return req.tenantEnforced === true && Boolean(req.auth?.businessId);
}

function scopedFilter(req, extra = {}) {
  if (!isTenantEnforced(req)) return { ...extra };
  return tenantFilter(req, extra);
}

async function findOwnedBrand(id, req) {
  if (!isTenantEnforced(req)) return Brand.findById(id);
  return findOwned(Brand, id, req);
}

function parseIsActive(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;

  const normalized = cleanString(value).toLowerCase();
  if (["true", "1", "active"].includes(normalized)) return true;
  if (["false", "0", "inactive"].includes(normalized)) return false;
  throw new ValidationError("Status must be Active or Inactive");
}

function validatePayload(body) {
  const name = normalizeName(body?.name);
  if (!name) throw new ValidationError("Brand name is required");
  if (name.length > 120) throw new ValidationError("Brand name must be 120 characters or fewer");

  const description = cleanString(body?.description);
  if (description.length > 500) {
    throw new ValidationError("Description must be 500 characters or fewer");
  }

  return {
    name,
    normalizedName: normalizedKey(name),
    description,
  };
}

function toBrandDto(brand, productCount = 0) {
  return {
    _id: brand._id,
    name: brand.name,
    normalizedName: brand.normalizedName,
    description: brand.description || "",
    isActive: brand.isActive !== false,
    productCount,
    businessId: brand.businessId || null,
    createdByUserId: brand.createdByUserId || null,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  };
}

async function productCountsFor(req, brands) {
  const ids = brands.map((brand) => brand._id).filter(Boolean);
  if (ids.length === 0) return new Map();

  const match = scopedFilter(req, { brandId: { $in: ids } });
  // Aggregation pipelines do not apply Mongoose query casting; convert the
  // tenant id so it matches the ObjectId stored on products.
  if (match.businessId) {
    match.businessId = new mongoose.Types.ObjectId(String(match.businessId));
  }

  const rows = await Product.aggregate([
    { $match: match },
    { $group: { _id: "$brandId", count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.count]));
}

function handleControllerError(error, res, next) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ message: error.message });
  }
  if (error instanceof ConflictError) {
    return res.status(409).json({ message: error.message });
  }
  if (error instanceof NotFoundError) {
    return res.status(404).json({ message: error.message });
  }
  if (error?.code === 11000) {
    return res.status(409).json({ message: "A brand with this name already exists" });
  }
  return next(error);
}

async function listBrands(req, res, next) {
  try {
    const filter = scopedFilter(req);
    const search = normalizeName(
      typeof req.query.search === "string" ? req.query.search : ""
    );
    if (search) {
      const pattern = escapeRegex(search);
      filter.$or = [
        { name: { $regex: pattern, $options: "i" } },
        { normalizedName: { $regex: pattern, $options: "i" } },
      ];
    }

    if (req.query.active !== undefined) {
      filter.isActive = parseIsActive(req.query.active, null);
      if (filter.isActive === null) {
        throw new ValidationError("active must be true or false");
      }
    }

    // Optional page/limit keeps type-ahead searches bounded for large catalogs.
    // Clients that omit them keep receiving the full list as before.
    const limit =
      req.query.limit === undefined || req.query.limit === ""
        ? null
        : parsePositiveInt(req.query.limit, "limit", 1, 100);
    const page =
      req.query.page === undefined || req.query.page === ""
        ? 1
        : parsePositiveInt(req.query.page, "page", 1, 100000);

    let query = Brand.find(filter).sort({ createdAt: -1 });
    if (limit) query = query.skip((page - 1) * limit).limit(limit);
    const brands = await query;

    const total = limit ? await Brand.countDocuments(filter) : brands.length;
    const hasMore = Boolean(limit && page * limit < total);
    const counts = await productCountsFor(req, brands);
    return res.status(200).json({
      brands: brands.map((brand) =>
        toBrandDto(brand, counts.get(String(brand._id)) || 0)
      ),
      total,
      page,
      pageSize: limit,
      hasMore,
    });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function getBrandById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw new ValidationError("Invalid brand id");
    }

    const brand = await findOwnedBrand(id, req);
    if (!brand) throw new NotFoundError("Brand not found");

    const counts = await productCountsFor(req, [brand]);
    return res.status(200).json({
      brand: toBrandDto(brand, counts.get(String(brand._id)) || 0),
    });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function createBrand(req, res, next) {
  try {
    const changes = validatePayload(req.body);
    const duplicateFilter = scopedFilter(req, { normalizedName: changes.normalizedName });
    const existing = await Brand.findOne(duplicateFilter);
    if (existing) {
      throw new ConflictError("A brand with this name already exists");
    }

    const brand = await Brand.create({
      ...changes,
      isActive: parseIsActive(req.body?.isActive, true),
      ...(isTenantEnforced(req)
        ? { businessId: req.auth.businessId, createdByUserId: req.auth.id }
        : {}),
    });

    return res.status(201).json({
      message: "Brand created",
      brand: toBrandDto(brand, 0),
    });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function updateBrand(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw new ValidationError("Invalid brand id");
    }

    const brand = await findOwnedBrand(id, req);
    if (!brand) throw new NotFoundError("Brand not found");

    const changes = validatePayload(req.body);
    const duplicateFilter = scopedFilter(req, {
      normalizedName: changes.normalizedName,
      _id: { $ne: brand._id },
    });
    const existing = await Brand.findOne(duplicateFilter);
    if (existing) {
      throw new ConflictError("A brand with this name already exists");
    }

    brand.name = changes.name;
    brand.normalizedName = changes.normalizedName;
    brand.description = changes.description;
    brand.isActive = parseIsActive(req.body?.isActive, brand.isActive);
    await brand.save();

    const counts = await productCountsFor(req, [brand]);
    return res.status(200).json({
      message: "Brand updated",
      brand: toBrandDto(brand, counts.get(String(brand._id)) || 0),
    });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function updateBrandStatus(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw new ValidationError("Invalid brand id");
    }

    const brand = await findOwnedBrand(id, req);
    if (!brand) throw new NotFoundError("Brand not found");

    const requested = req.body?.isActive !== undefined ? req.body.isActive : req.body?.status;
    if (requested === undefined || requested === null || cleanString(requested) === "") {
      throw new ValidationError("isActive is required");
    }

    brand.isActive = parseIsActive(requested, brand.isActive);
    await brand.save();

    const counts = await productCountsFor(req, [brand]);
    return res.status(200).json({
      message: brand.isActive ? "Brand activated" : "Brand deactivated",
      brand: toBrandDto(brand, counts.get(String(brand._id)) || 0),
    });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

module.exports = {
  listBrands,
  getBrandById,
  createBrand,
  updateBrand,
  updateBrandStatus,
};
