export type OpeningBalancePaymentKind = "payment" | "reversal";

export type OpeningBalancePaymentRecord = {
  _id: string;
  amount: number;
  method: string;
  reference: string;
  paidAt: string;
  createdBy: string;
  idempotencyKey: string;
  kind: OpeningBalancePaymentKind;
  reversesPaymentId: string;
};

export type OpeningBalancePaymentInput = {
  amount: number;
  method: string;
  reference: string;
  idempotencyKey: string;
};
