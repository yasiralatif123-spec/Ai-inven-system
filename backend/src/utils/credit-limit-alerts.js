const { parseStoredMoney, roundMoney } = require("./units");

const NEAR_CREDIT_LIMIT_PERCENT = 80;

function nonNegativeMoney(value) {
  const parsed = parseStoredMoney(value);
  return parsed === null ? 0 : Math.max(0, parsed);
}

/**
 * Derives reusable credit-limit alert fields from an already authoritative
 * customer outstanding amount. A zero limit means "No Limit Set", so it never
 * produces a near-limit or exceeded alert.
 */
function evaluateCustomerCreditLimit({ creditLimit, outstanding } = {}) {
  const limit = nonNegativeMoney(creditLimit);
  const due = nonNegativeMoney(outstanding);

  if (limit === 0) {
    return {
      hasLimit: false,
      creditStatus: "no-limit",
      nearCreditLimit: false,
      creditLimitExceeded: false,
      availableCredit: 0,
      creditExposurePercent: 0,
    };
  }

  const availableCredit = roundMoney(Math.max(limit - due, 0));
  const creditLimitExceeded = due > limit;
  const creditExposurePercent = Math.round((due / limit) * 1000) / 10;
  const nearCreditLimit =
    !creditLimitExceeded && creditExposurePercent >= NEAR_CREDIT_LIMIT_PERCENT;

  return {
    hasLimit: true,
    creditStatus: creditLimitExceeded
      ? "exceeded"
      : nearCreditLimit
        ? "near"
        : "within",
    nearCreditLimit,
    creditLimitExceeded,
    availableCredit,
    creditExposurePercent,
  };
}

module.exports = {
  NEAR_CREDIT_LIMIT_PERCENT,
  evaluateCustomerCreditLimit,
};
