const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const SaleOrder = require("../models/SaleOrder");
const { tenantFilter } = require("../utils/tenant");
const { resolveActorName } = require("../utils/actor");
const { withAuthoritativeCustomerFinancials } = require("../utils/financials");
const { parseMoneyInput } = require("../utils/units");
const {
  recordOpeningBalancePayment,
  OpeningBalancePaymentValidationError,
  OpeningBalancePaymentConflictError,
  OpeningBalancePaymentNotFoundError,
} = require("../utils/opening-balance-payments");

function isTenantEnforced(req) {
  return req.tenantEnforced === true && Boolean(req.auth?.businessId);
}

function scopedFilter(req, extra = {}) {
  if (!isTenantEnforced(req)) return { ...extra };
  return tenantFilter(req, extra);
}

function financialBusinessId(req) {
  return isTenantEnforced(req) ? req.auth.businessId : null;
}

async function customerResponse(customer, req) {
  const [withFinancials] = await withAuthoritativeCustomerFinancials([customer], {
    businessId: financialBusinessId(req),
  });
  return withFinancials;
}

const CITIES = {
  Lahore: "Lahore (Central Punjab Hub)",
  Karachi: "Karachi (Sindh Port Operations)",
  Rawalpindi: "Rawalpindi / Islamabad (Capital Territory)",
  Faisalabad: "Faisalabad (Textile Grid)",
  Multan: "Multan (South Punjab Zone)",
  Peshawar: "Peshawar (KP Northern Hub)",
  Quetta: "Quetta (Balochistan Distribution)",
  Gujranwala: "Gujranwala (Industrial Belt)",
  Sialkot: "Sialkot (Export Processing)",
};

const ROUTES = {
  "lahore-central": "Lahore Central · Shah Alam & Brandreth Route",
  "lahore-north": "Lahore North · Badami Bagh & Ravi Belt",
  "lahore-south": "Lahore South · Kot Lakhpat & Ferozepur Sector",
  "multan-road": "Lahore West · Multan Road Logistics Strip",
  "intercity-gt": "Intercity Trunk · GT Road Rawalpindi Cargo",
  unassigned: "Unassigned Direct Counter Customer",
};

const CUSTOMER_TYPES = ["Wholesale", "Retailer", "Distributor", "Other"];
const STATUSES = ["Active", "Inactive", "Blocked"];
const PAYMENT_TERMS = ["cod", "7days", "15days", "30days", "45days"];
const GRACE_PERIODS = ["none", "3days", "5days", "7days"];

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function parseNumber(value, { message, fallback }) {
  if (value === undefined || value === null || String(value).trim() === "") {
    if (message) throw new ValidationError(message);
    return fallback;
  }

  const numeric = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(message || "Enter a valid number");
  }
  return numeric;
}

function normalizePhone(value, label = "Primary phone number") {
  const raw = cleanString(value);
  if (!raw) throw new ValidationError(`${label} is required`);

  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("92")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);

  if (digits.length !== 10) {
    throw new ValidationError("Enter a valid 11-digit mobile or PTCL number");
  }

  return `+92 ${digits.slice(0, 3)} ${digits.slice(3)}`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function generateLedgerCode(req) {
  const filter = scopedFilter(req, { ledgerCode: /^C-\d+$/ });
  const customers = await Customer.find(filter).select("ledgerCode").lean();

  const highest = customers.reduce((max, customer) => {
    const value = Number(cleanString(customer.ledgerCode).replace("C-", ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 409);

  return `C-${highest + 1}`;
}

function buildCustomerChanges(body, req = null) {
  const name = cleanString(body.name);
  if (!name) throw new ValidationError("Full name is required");

  const businessName = cleanString(body.businessName);
  if (!businessName) throw new ValidationError("Business / trade title is required");

  const phone = normalizePhone(body.phone);

  const city = cleanString(body.city);
  if (!city) throw new ValidationError("Commercial hub / city is required");
  if (!CITIES[city]) throw new ValidationError("Invalid commercial hub / city");

  const address = cleanString(body.address);
  if (!address) throw new ValidationError("Physical dispatch address is required");
  if (address.length > 300) {
    throw new ValidationError("Physical dispatch address cannot exceed 300 characters");
  }

  const customerType = cleanString(body.customerType);
  if (!customerType) throw new ValidationError("Customer classification is required");
  if (!CUSTOMER_TYPES.includes(customerType)) {
    throw new ValidationError("Invalid customer classification");
  }

  const status = cleanString(body.status) || "Active";
  if (!STATUSES.includes(status)) throw new ValidationError("Invalid account status");

  const route = cleanString(body.route) || "unassigned";
  if (!ROUTES[route]) throw new ValidationError("Invalid distribution route");

  const paymentTerms = cleanString(body.paymentTerms);
  if (!paymentTerms) throw new ValidationError("Payment terms is required");
  if (!PAYMENT_TERMS.includes(paymentTerms)) throw new ValidationError("Invalid payment terms");

  const creditLimit = parseMoneyInput(body.creditLimit);
  if (creditLimit === null) {
    throw new ValidationError(
      "Trade credit limit must be a finite, non-negative number"
    );
  }

  const openingBalance = parseNumber(body.openingBalance, { fallback: 0 });
  if (openingBalance < 0) throw new ValidationError("Opening balance cannot be negative");

  const gracePeriod = cleanString(body.gracePeriod) || "none";
  if (!GRACE_PERIODS.includes(gracePeriod)) throw new ValidationError("Invalid grace period");

  const email = cleanString(body.email);
  if (email && !isValidEmail(email)) throw new ValidationError("Enter a valid email address");

  const altPhone = cleanString(body.altPhone)
    ? normalizePhone(body.altPhone, "Alternate phone number")
    : "";

  const notes = cleanString(body.notes);
  if (notes.length > 500) throw new ValidationError("Internal notes cannot exceed 500 characters");

  return {
    name,
    businessName,
    phone,
    altPhone,
    email,
    city,
    cityLabel: CITIES[city],
    address,
    customerType,
    status,
    route,
    routeLabel: ROUTES[route],
    ntn: cleanString(body.ntn),
    creditLimit,
    paymentTerms,
    openingBalance,
    gracePeriod,
    notes,
    orders: 0,
    totalPurchases: 0,
    outstanding: openingBalance,
    createdBy: resolveActorName(req),
  };
}

function handleControllerError(error, res, next) {
  if (error instanceof ValidationError || error instanceof OpeningBalancePaymentValidationError) {
    return res.status(400).json({ message: error.message });
  }
  if (error instanceof OpeningBalancePaymentConflictError) {
    return res.status(409).json({ message: error.message });
  }
  if (error instanceof OpeningBalancePaymentNotFoundError) {
    return res.status(404).json({ message: error.message });
  }
  return next(error);
}

async function getNextCustomerCode(req, res, next) {
  try {
    return res.status(200).json({ code: await generateLedgerCode(req) });
  } catch (error) {
    return next(error);
  }
}

async function getCustomers(req, res, next) {
  try {
    const filter = scopedFilter(req);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { ledgerCode: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();
    const withFinancials = await withAuthoritativeCustomerFinancials(customers, {
      businessId: financialBusinessId(req),
    });
    return res.status(200).json({ customers: withFinancials });
  } catch (error) {
    return next(error);
  }
}

async function getCustomerById(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const customer = await Customer.findOne(scopedFilter(req, { _id: id })).lean();
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({ customer: await customerResponse(customer, req) });
  } catch (error) {
    return next(error);
  }
}

async function getCustomerByCode(req, res, next) {
  try {
    const ledgerCode = cleanString(req.params.ledgerCode);
    if (!ledgerCode) {
      return res.status(400).json({ message: "ledgerCode is required" });
    }
    const customer = await Customer.findOne(scopedFilter(req, { ledgerCode })).lean();
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    return res.status(200).json({ customer: await customerResponse(customer, req) });
  } catch (error) {
    return next(error);
  }
}

async function createCustomer(req, res, next) {
  try {
    const changes = buildCustomerChanges(req.body || {}, req);
    let customer;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        customer = await Customer.create({
          ledgerCode: await generateLedgerCode(req),
          ...changes,
          ...(isTenantEnforced(req)
            ? { businessId: req.auth.businessId, createdByUserId: req.auth.id }
            : {}),
        });
        break;
      } catch (error) {
        if (error?.code === 11000 && attempt < 4) continue;
        throw error;
      }
    }

    return res.status(201).json({
      message: "Customer created",
      customer: await customerResponse(customer, req),
    });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const existing = await Customer.findOne(scopedFilter(req, { _id: id })).lean();
    if (!existing) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const body = req.body || {};
    const merged = {
      ...existing,
      ...body,
      ledgerCode: existing.ledgerCode,
      creditLimit:
        body.creditLimit === undefined ? existing.creditLimit : body.creditLimit,
      paymentTerms: existing.paymentTerms,
      openingBalance: existing.openingBalance,
      gracePeriod: existing.gracePeriod,
      createdBy: existing.createdBy,
    };

    const changes = buildCustomerChanges(merged, req);
    delete changes.orders;
    delete changes.totalPurchases;
    delete changes.outstanding;
    delete changes.createdBy;

    const customer = await Customer.findOneAndUpdate(scopedFilter(req, { _id: id }), changes, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({
      message: "Customer updated",
      customer: await customerResponse(customer, req),
    });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function recordCustomerOpeningBalancePayment(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const customer = await recordOpeningBalancePayment({
      Model: Customer,
      type: "customer",
      req,
      id,
    });
    return res.status(200).json({
      message: "Opening balance payment recorded",
      customer: await customerResponse(customer, req),
    });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function reverseCustomerOpeningBalancePayment(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const customer = await recordOpeningBalancePayment({
      Model: Customer,
      type: "customer",
      req,
      id,
      paymentId: req.params.paymentId,
    });
    return res.status(200).json({
      message: "Opening balance payment reversed",
      customer: await customerResponse(customer, req),
    });
  } catch (error) {
    return handleControllerError(error, res, next);
  }
}

async function deleteCustomer(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const hasHistory = await SaleOrder.exists(
      scopedFilter(req, { "customer.customerId": id })
    );
    if (hasHistory) {
      return res.status(409).json({
        message: "Customer has sale/payment history and cannot be deleted",
      });
    }

    const customer = await Customer.findOne(scopedFilter(req, { _id: id }))
      .select("openingBalance")
      .lean();
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    if (Number(customer.openingBalance) > 0) {
      return res.status(409).json({
        message: "Customer has an opening balance and cannot be deleted",
      });
    }

    const deleted = await Customer.findOneAndDelete(scopedFilter(req, { _id: id }));
    if (!deleted) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({ message: "Customer deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getNextCustomerCode,
  getCustomers,
  getCustomerById,
  getCustomerByCode,
  createCustomer,
  updateCustomer,
  recordCustomerOpeningBalancePayment,
  reverseCustomerOpeningBalancePayment,
  deleteCustomer,
};
