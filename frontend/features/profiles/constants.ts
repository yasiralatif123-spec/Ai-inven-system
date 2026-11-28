// Kept aligned with the existing generic purchase payment contract so this
// feature does not introduce a third, inconsistent method list.
export const OPENING_BALANCE_PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Cheque",
  "Online Transfer",
] as const;
