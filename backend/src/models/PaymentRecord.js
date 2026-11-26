const mongoose = require("mongoose");
const { hasUniquePaymentKeys } = require("../utils/payment-accounting");

/**
 * Shared embedded payment record used by sale orders and purchases. The
 * idempotencyKey is scoped to the parent document; uniqueness is enforced by
 * the conditional payment updates in the controllers and by the array
 * validator below.
 */
const paymentRecordSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, default: "Cash", trim: true },
    reference: { type: String, default: "", trim: true },
    paidAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: "System", trim: true },
    idempotencyKey: { type: String, default: "", trim: true },
  },
  { _id: true }
);

const paymentRecordsField = {
  type: [paymentRecordSchema],
  default: [],
  validate: {
    validator: hasUniquePaymentKeys,
    message: "Duplicate payment idempotency keys are not allowed",
  },
};

module.exports = { paymentRecordSchema, paymentRecordsField };
