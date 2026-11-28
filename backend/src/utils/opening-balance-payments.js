const { tenantFilter } = require("./tenant");
const { resolveActorName } = require("./actor");
const { runWithSession } = require("./db");
const {
  buildPaymentRecord,
  findPaymentByKey,
  isOpeningBalancePaymentMethod,
  openingBalancePaymentById,
  parsePaymentAmount,
  resolveIdempotencyKey,
  reversalTotalFor,
  roundMoney,
  sumOpeningBalancePayments,
} = require("./payment-accounting");
const {
  recalculateCustomerFinancials,
  recalculateSupplierFinancials,
} = require("./financials");

class OpeningBalancePaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "OpeningBalancePaymentValidationError";
  }
}

class OpeningBalancePaymentConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "OpeningBalancePaymentConflictError";
  }
}

class OpeningBalancePaymentNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "OpeningBalancePaymentNotFoundError";
  }
}

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function scopedFilter(req, extra = {}) {
  if (req.tenantEnforced === true && Boolean(req.auth?.businessId)) {
    return tenantFilter(req, extra);
  }
  return { ...extra };
}

function refreshFinancials({ type, id, req, session }) {
  const businessId = req.tenantEnforced === true ? req.auth?.businessId || null : null;
  if (type === "customer") {
    return recalculateCustomerFinancials({ customerId: id, businessId, session });
  }
  return recalculateSupplierFinancials({ supplierId: id, businessId, session });
}

/**
 * Appends a payment or reversal to a party's opening-balance ledger. Writes are
 * conditional on the observed __v and on the idempotency key not already being
 * present, so concurrent requests cannot double-spend the same remaining
 * balance. Failed writes retry from a fresh read before returning a conflict.
 */
async function recordOpeningBalancePayment({ Model, type, req, id, paymentId = null }) {
  let amount;
  let idempotencyKey;
  try {
    amount = parsePaymentAmount(req.body?.amount);
    idempotencyKey = resolveIdempotencyKey(req, {
      kind: `${type}_opening_balance${paymentId ? "_reversal" : ""}`,
      documentId: id,
      amount,
    });
  } catch (error) {
    throw new OpeningBalancePaymentValidationError(error.message);
  }

  const method = cleanString(req.body?.method) || "Cash";
  if (!isOpeningBalancePaymentMethod(method)) {
    throw new OpeningBalancePaymentValidationError(`Unsupported payment method: ${method}`);
  }
  const reference = cleanString(req.body?.reference);
  const actor = resolveActorName(req);

  return runWithSession(async (session, useTransaction) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const current = await Model.findOne(scopedFilter(req, { _id: id })).session(session);
      if (!current) {
        throw new OpeningBalancePaymentNotFoundError(
          type === "customer" ? "Customer not found" : "Supplier not found"
        );
      }

      const payments = Array.isArray(current.openingBalancePayments)
        ? current.openingBalancePayments
        : [];

      const replay = findPaymentByKey({ payments }, idempotencyKey);
      if (replay) {
        if (roundMoney(replay.amount) !== amount) {
          throw new OpeningBalancePaymentConflictError(
            "This idempotency key was already used for a different payment"
          );
        }
        if (paymentId && cleanString(replay.reversesPaymentId) !== cleanString(paymentId)) {
          throw new OpeningBalancePaymentConflictError(
            "This idempotency key was already used for a different reversal"
          );
        }
        await refreshFinancials({ type, id, req, session }).catch(() => {});
        return current;
      }

      let record;
      if (paymentId) {
        const original = openingBalancePaymentById(payments, paymentId);
        if (!original || cleanString(original.kind) === "reversal") {
          throw new OpeningBalancePaymentValidationError("Payment record not found");
        }
        const alreadyReversed = reversalTotalFor(payments, paymentId);
        if (alreadyReversed + amount > roundMoney(original.amount)) {
          throw new OpeningBalancePaymentValidationError(
            "Reversal cannot exceed the original payment"
          );
        }
        record = buildPaymentRecord({
          amount,
          method,
          reference,
          idempotencyKey,
          createdBy: actor,
          kind: "reversal",
          reversesPaymentId: cleanString(paymentId),
        });
      } else {
        const remaining = roundMoney(
          Math.max(
            roundMoney(Number(current.openingBalance) || 0) -
              sumOpeningBalancePayments(payments),
            0
          )
        );
        if (amount > remaining) {
          throw new OpeningBalancePaymentValidationError(
            `Payment cannot exceed the remaining opening balance (${remaining})`
          );
        }
        record = buildPaymentRecord({
          amount,
          method,
          reference,
          idempotencyKey,
          createdBy: actor,
          kind: "payment",
        });
      }

      const expectedVersion = Number(current.__v) || 0;
      const writeResult = await Model.updateOne(
        scopedFilter(req, {
          _id: id,
          __v: expectedVersion,
          "openingBalancePayments.idempotencyKey": { $ne: idempotencyKey },
        }),
        {
          $push: { openingBalancePayments: record },
          $inc: { __v: 1 },
        },
        { session, runValidators: true }
      );

      if (writeResult.matchedCount !== 1) {
        if (attempt < 4) continue;
        throw new OpeningBalancePaymentConflictError(
          type === "customer"
            ? "This customer changed while the payment was being recorded"
            : "This supplier changed while the payment was being recorded"
        );
      }

      try {
        await refreshFinancials({ type, id, req, session });
        return await Model.findOne(scopedFilter(req, { _id: id })).session(session);
      } catch (error) {
        if (!useTransaction) {
          await Model.updateOne(
            scopedFilter(req, { _id: id, __v: expectedVersion + 1 }),
            {
              $pull: { openingBalancePayments: { idempotencyKey } },
              $inc: { __v: -1 },
            },
            { session }
          ).catch(() => {});
          await refreshFinancials({ type, id, req, session }).catch(() => {});
        }
        throw error;
      }
    }

    throw new OpeningBalancePaymentConflictError(
      type === "customer"
        ? "This customer is busy with another payment. Please retry."
        : "This supplier is busy with another payment. Please retry."
    );
  });
}

module.exports = {
  recordOpeningBalancePayment,
  OpeningBalancePaymentValidationError,
  OpeningBalancePaymentConflictError,
  OpeningBalancePaymentNotFoundError,
};
