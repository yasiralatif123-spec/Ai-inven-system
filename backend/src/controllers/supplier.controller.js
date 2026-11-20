const mongoose = require("mongoose");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");

const HUBS = {
  karachi: {
    label: "Karachi (SITE / Korangi Hub)",
    region: "Karachi",
  },
  lahore: {
    label: "Lahore (Shah Alam / Badami Bagh)",
    region: "Lahore",
  },
  faisalabad: {
    label: "Faisalabad Central",
    region: "Faisalabad & Multan",
  },
  multan: {
    label: "Multan Industrial",
    region: "Faisalabad & Multan",
  },
  rawalpindi: {
    label: "Rawalpindi Grain Market",
    region: "Rawalpindi & KPK",
  },
};

const PAYMENT_TERMS = {
  "net-15": "Net 15d",
  "net-30": "Net 30d",
  "net-7": "Net 7d",
  cod: "COD",
  advance: "Advance",
};

const TAX_STATUSES = ["standard", "exempt", "non-filer"];
const GRACE_DAYS = [0, 5, 10, 15];

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const numeric = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizePhone(value) {
  const digits = cleanString(value).replace(/\D/g, "");
  if (digits.length < 10) {
    throw new ValidationError("Enter a valid phone number with at least 10 digits");
  }

  const local = digits.startsWith("92") ? digits.slice(2) : digits;
  if (local.length < 10) {
    throw new ValidationError("Enter a valid phone number with at least 10 digits");
  }

  return `+92 ${local}`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function generateSupplierCode() {
  const suppliers = await Supplier.find({ supplierCode: /^S-\d+$/ })
    .select("supplierCode")
    .lean();

  const highest = suppliers.reduce((max, supplier) => {
    const value = Number(cleanString(supplier.supplierCode).replace("S-", ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 207);

  return `S-${highest + 1}`;
}

async function normalizeSupplierProducts(value, existingIds = [], flavorValues = {}) {
  if (value === undefined || value === null) return { productIds: [], productFlavors: {} };
  if (!Array.isArray(value)) {
    throw new ValidationError("Product selection must be a list");
  }

  const ids = Array.from(new Set(value.map(cleanString).filter(Boolean)));
  if (ids.length === 0) return { productIds: [], productFlavors: {} };

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw new ValidationError("One or more selected products are invalid");
  }

  const foundProducts = await Product.find({ _id: { $in: ids } })
    .select("_id flavors")
    .lean();
  const foundById = new Map(
    foundProducts.map((product) => [cleanString(product._id), product])
  );
  const existingIdSet = new Set(existingIds.map(cleanString));
  const invalidNewIds = ids.filter(
    (id) => !foundById.has(id) && !existingIdSet.has(id)
  );

  if (invalidNewIds.length > 0) {
    throw new ValidationError("One or more selected products no longer exist in the catalog");
  }

  // Product IDs already saved on a supplier can outlive catalog products. Prune
  // those stale links during an edit instead of blocking unrelated changes.
  const productIds = ids.filter((id) => foundById.has(id));
  const rawFlavors =
    flavorValues instanceof Map
      ? Object.fromEntries(flavorValues.entries())
      : flavorValues && typeof flavorValues === "object" && !Array.isArray(flavorValues)
        ? flavorValues
        : {};
  const productFlavors = {};

  for (const [productId, rawFlavorEntry] of Object.entries(rawFlavors)) {
    if (!productIds.includes(productId)) continue;
    const rawFlavorsForProduct = Array.isArray(rawFlavorEntry)
      ? rawFlavorEntry
      : rawFlavorEntry === undefined || rawFlavorEntry === null || rawFlavorEntry === ""
        ? []
        : [rawFlavorEntry];
    const allowedFlavors = Array.isArray(foundById.get(productId)?.flavors)
      ? foundById.get(productId).flavors
      : [];
    const canonicalFlavors = [];

    for (const entry of rawFlavorsForProduct) {
      for (const part of String(entry).split(/[\n,]/)) {
        const flavor = cleanString(part).replace(/\s+/g, " ").slice(0, 120);
        if (!flavor) continue;
        const canonical = allowedFlavors.find(
          (candidate) => cleanString(candidate).toLowerCase() === flavor.toLowerCase()
        );
        const value = canonical ? cleanString(canonical) : "";
        if (value && !canonicalFlavors.some((item) => item.toLowerCase() === value.toLowerCase())) {
          canonicalFlavors.push(value);
        }
      }
    }

    if (canonicalFlavors.length > 0) productFlavors[productId] = canonicalFlavors;
  }

  return { productIds, productFlavors };
}

async function buildSupplierChanges(body, options = {}) {
  const name = cleanString(body.name);
  if (!name) throw new ValidationError("Supplier name is required");

  const contactPerson = cleanString(body.contactPerson);
  if (!contactPerson) throw new ValidationError("Contact person is required");

  const phone = normalizePhone(body.phone);

  const address = cleanString(body.address);
  if (!address) throw new ValidationError("Warehouse address is required");

  const paymentTerms = cleanString(body.paymentTerms);
  if (!paymentTerms) throw new ValidationError("Payment terms is required");
  if (!PAYMENT_TERMS[paymentTerms]) throw new ValidationError("Invalid payment terms");

  const hubKey = cleanString(body.hub);
  if (hubKey && !HUBS[hubKey]) throw new ValidationError("Invalid distribution hub");

  const taxStatus = cleanString(body.taxStatus) || "standard";
  if (!TAX_STATUSES.includes(taxStatus)) throw new ValidationError("Invalid tax status");

  const email = cleanString(body.email);
  if (email && !isValidEmail(email)) throw new ValidationError("Enter a valid email address");

  const openingBalance = toNumber(body.openingBalance);
  if (openingBalance < 0) throw new ValidationError("Opening balance cannot be negative");

  const graceDays =
    body.graceDays === undefined || body.graceDays === null || body.graceDays === ""
      ? 5
      : toNumber(body.graceDays, 5);
  if (!GRACE_DAYS.includes(graceDays)) throw new ValidationError("Invalid grace days");

  const notes = cleanString(body.notes);
  if (notes.length > 500) throw new ValidationError("Procurement notes cannot exceed 500 characters");

  const { productIds, productFlavors } = await normalizeSupplierProducts(
    body.productIds,
    options.existingProductIds || [],
    body.productFlavors
  );

  const hub = HUBS[hubKey] || { label: "", region: "" };
  const outstanding = openingBalance;

  return {
    name,
    contactPerson,
    phone,
    email,
    hub: hub.label,
    region: hub.region,
    taxStatus,
    address,
    ntn: cleanString(body.ntn),
    paymentTerms,
    openingBalance,
    graceDays,
    notes,
    productIds,
    productFlavors,
    status: "Active",
    totalPurchases: 0,
    outstanding,
    payableNote: outstanding > 0 ? PAYMENT_TERMS[paymentTerms] : "Cleared / Nil",
    payableTone: outstanding > 0 ? "danger" : "success",
    createdBy: cleanString(body.createdBy) || "Tariq M. (Owner)",
  };
}

function handleControllerError(error, res, next) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ message: error.message });
  }
  return next(error);
}

async function getNextSupplierCode(req, res, next) {
  try {
    return res.status(200).json({ code: await generateSupplierCode() });
  } catch (error) {
    return next(error);
  }
}

async function getSuppliers(req, res, next) {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ suppliers });
  } catch (error) {
    return next(error);
  }
}

async function getSupplierById(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const supplier = await Supplier.findById(id).lean();
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    return res.status(200).json({ supplier });
  } catch (error) {
    return next(error);
  }
}

async function createSupplier(req, res, next) {
  try {
    const changes = await buildSupplierChanges(req.body || {});
    let supplier;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        supplier = await Supplier.create({
          supplierCode: await generateSupplierCode(),
          ...changes,
        });
        break;
      } catch (error) {
        if (error?.code === 11000 && attempt < 4) continue;
        throw error;
      }
    }

    return res.status(201).json({ message: "Supplier created", supplier });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function updateSupplier(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const existing = await Supplier.findById(id).lean();
    if (!existing) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const merged = {
      ...existing,
      ...(req.body || {}),
      supplierCode: existing.supplierCode,
      status: existing.status,
      openingBalance: existing.openingBalance,
      totalPurchases: existing.totalPurchases,
      outstanding: existing.outstanding,
      payableNote: existing.payableNote,
      payableTone: existing.payableTone,
      lastPurchaseAt: existing.lastPurchaseAt,
      createdBy: existing.createdBy,
    };

    const changes = await buildSupplierChanges(merged, {
      existingProductIds: Array.isArray(existing.productIds) ? existing.productIds : [],
    });
    delete changes.status;
    delete changes.openingBalance;
    delete changes.totalPurchases;
    delete changes.outstanding;
    delete changes.payableNote;
    delete changes.payableTone;
    delete changes.createdBy;

    const supplier = await Supplier.findByIdAndUpdate(id, changes, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({ message: "Supplier updated", supplier });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function deleteSupplier(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    return res.status(200).json({ message: "Supplier deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getNextSupplierCode,
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
