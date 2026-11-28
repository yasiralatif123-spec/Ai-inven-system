const crypto = require("crypto");
const { parseMoneyInput, roundMoney } = require("./units");

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

/**
 * Strictly parses a manual payment amount. Unlike toNumber(), malformed values
 * are rejected instead of being silently coerced to zero.
 */
function parsePaymentAmount(value, label = "Payment amount") {
  const amount = parseMoneyInput(value);
  if (amount === null) {
    throw new Error(`${label} must be a finite, non-negative number`);
  }
  if (amount <= 0) {
    throw new Error(`${label} must be greater than zero`);
  }
  return roundMoney(amount);
}

function createIdempotencyKey(prefix = "pay") {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Resolves the idempotency key for a manual payment. Explicit keys may come
 * from the Idempotency-Key header or body. When absent, a deterministic legacy
 * fallback keeps existing callers safe from identical retries; new clients
 * should send an explicit key so separate but identical payments remain possible.
 */
function resolveIdempotencyKey(req, { kind, documentId, amount }) {
  const headerKey = cleanString(
    req.get ? req.get("Idempotency-Key") : req.headers?.["idempotency-key"]
  );
  const explicitKey = headerKey || cleanString(req.body?.idempotencyKey);
  if (explicitKey) {
    if (explicitKey.length > 200) {
      throw new Error("Idempotency-Key must be 200 characters or fewer");
    }
    return explicitKey;
  }

  const basis = [
    kind,
    String(documentId),
    amount,
    cleanString(req.body?.method),
    cleanString(req.body?.reference),
  ].join("|");
  return `legacy_${crypto.createHash("sha256").update(basis).digest("hex").slice(0, 32)}`;
}

const OPENING_BALANCE_PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Cheque",
  "Online Transfer",
];

function buildPaymentRecord({
  amount,
  method = "Cash",
  reference = "",
  idempotencyKey,
  createdBy = "System",
  paidAt = new Date(),
  kind = "payment",
  reversesPaymentId = "",
}) {
  return {
    amount: roundMoney(amount),
    method: cleanString(method) || "Cash",
    reference: cleanString(reference),
    paidAt,
    createdBy: cleanString(createdBy) || "System",
    idempotencyKey: cleanString(idempotencyKey),
    kind: kind === "reversal" ? "reversal" : "payment",
    reversesPaymentId: cleanString(reversesPaymentId),
  };
}

function plainPayments(doc) {
  const payments = Array.isArray(doc?.payments) ? doc.payments : [];
  return payments.map((payment) =>
    typeof payment?.toObject === "function" ? payment.toObject() : { ...payment }
  );
}

function sumPayments(payments) {
  return roundMoney(
    plainPayments({ payments }).reduce(
      (sum, payment) => sum + (Number(payment?.amount) > 0 ? Number(payment.amount) : 0),
      0
    )
  );
}

function findPaymentByKey(doc, idempotencyKey) {
  if (!idempotencyKey) return null;
  return plainPayments(doc).find((payment) => payment.idempotencyKey === idempotencyKey) || null;
}

function hasUniquePaymentKeys(payments) {
  if (!Array.isArray(payments)) return true;
  const seen = new Set();
  for (const payment of payments) {
    const key = cleanString(payment?.idempotencyKey);
    if (!key) continue;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

function buildPaymentLabel(paymentStatus, paid, method) {
  if (paymentStatus === "paid") return `Paid (${method || "Cash"})`;
  if (paymentStatus === "partial") {
    const value = roundMoney(paid);
    const compact = value >= 1000
      ? `${Number.isInteger(value / 1000) ? value / 1000 : (value / 1000).toFixed(1)}k`
      : String(value);
    return `Partial (${compact})`;
  }
  return "Unpaid (Due on receipt)";
}

/**
 * Derives the sale's stored payment state from the total and the cumulative
 * recorded paid amount. Payment status is never trusted from the client.
 */
function deriveSalePaymentState({ total, paid, method, dueDate }) {
  const nextTotal = roundMoney(total);
  const nextPaid = roundMoney(paid);
  const outstanding = roundMoney(Math.max(nextTotal - nextPaid, 0));
  const paymentStatus = outstanding === 0 ? "paid" : nextPaid === 0 ? "unpaid" : "partial";
  return {
    paid: nextPaid,
    outstanding,
    paymentStatus,
    paymentLabel: buildPaymentLabel(paymentStatus, nextPaid, method),
    dueDate: outstanding === 0 ? "Settled in full" : cleanString(dueDate) || "Due on receipt",
  };
}

function derivePurchasePaidAmount({ paidAmount, amount }) {
  return roundMoney(roundMoney(paidAmount) + roundMoney(amount));
}

/**
 * Legacy documents can carry a paid total without a payment ledger. On the
 * first new payment we record that existing total as a balance carried forward
 * so paid totals remain equal to the sum of recorded payments. This does not
 * invent money; it makes the already-saved aggregate auditable.
 */
function buildLegacyBalancePayment({ paid, documentId, method, reference, paidAt, createdBy }) {
  const amount = roundMoney(paid);
  if (amount <= 0) return null;
  return buildPaymentRecord({
    amount,
    method,
    reference: reference || `Legacy paid balance for ${documentId}`,
    idempotencyKey: `legacy_balance_${documentId}`,
    createdBy,
    paidAt,
  });
}

/** Returns the recorded paid total, falling back to a legacy stored aggregate. */
function ledgerPaid(doc, legacyPaid) {
  const payments = plainPayments(doc);
  if (payments.length > 0) return sumPayments(payments);
  return roundMoney(legacyPaid);
}

function isOpeningBalancePaymentMethod(method) {
  return OPENING_BALANCE_PAYMENT_METHODS.includes(cleanString(method));
}

/** Net opening-balance amount after append-only payment and reversal records. */
function sumOpeningBalancePayments(payments) {
  const rows = plainPayments({ payments });
  const paid = rows.reduce(
    (sum, row) => (cleanString(row.kind) === "reversal" ? sum : sum + (Number(row.amount) || 0)),
    0
  );
  const reversed = rows.reduce(
    (sum, row) => (cleanString(row.kind) === "reversal" ? sum + (Number(row.amount) || 0) : sum),
    0
  );
  return roundMoney(Math.max(paid - reversed, 0));
}

function openingBalancePaymentById(payments, paymentId) {
  const id = cleanString(paymentId);
  if (!id) return null;
  return (
    plainPayments({ payments }).find(
      (row) =>
        cleanString(row._id) === id &&
        cleanString(row.kind) !== "reversal"
    ) || null
  );
}

function reversalTotalFor(payments, paymentId) {
  const id = cleanString(paymentId);
  return roundMoney(
    plainPayments({ payments }).reduce((sum, row) => {
      if (cleanString(row.kind) !== "reversal") return sum;
      return cleanString(row.reversesPaymentId) === id ? sum + (Number(row.amount) || 0) : sum;
    }, 0)
  );
}

module.exports = {
  roundMoney,
  parsePaymentAmount,
  createIdempotencyKey,
  resolveIdempotencyKey,
  buildPaymentRecord,
  plainPayments,
  sumPayments,
  findPaymentByKey,
  hasUniquePaymentKeys,
  buildPaymentLabel,
  deriveSalePaymentState,
  derivePurchasePaidAmount,
  buildLegacyBalancePayment,
  ledgerPaid,
  OPENING_BALANCE_PAYMENT_METHODS,
  isOpeningBalancePaymentMethod,
  sumOpeningBalancePayments,
  openingBalancePaymentById,
  reversalTotalFor,
};
