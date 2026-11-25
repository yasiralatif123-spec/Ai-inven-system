"use client";

import { useState, type FormEvent } from "react";
import { PAYMENT_METHODS } from "../constants";
import type { PaymentInput, SalesOrder } from "../types";
import { formatRs } from "../utils";

type RecordPaymentDialogProps = {
  order: SalesOrder;
  onClose: () => void;
  onSubmit: (input: PaymentInput) => Promise<void>;
};

export function RecordPaymentDialog({ order, onClose, onSubmit }: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState(String(order.financials.outstanding));
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = Number(amount);
  const canSubmit =
    Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= order.financials.outstanding;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ amount: numericAmount, method });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to record payment. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-overlay/30 p-4 pt-20">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded border border-outline-variant bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-high/40 px-4 py-3">
          <div>
            <div className="font-headline-md text-headline-md text-on-surface">Record Payment</div>
            <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
              #{order.id} · {order.customer}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment form"
            className="flex h-7 w-7 items-center justify-center rounded text-secondary transition-colors hover:bg-row-hover hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between rounded border border-outline-variant bg-surface-container-low px-3 py-2">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Outstanding Balance</span>
            <span className="font-mono-data text-mono-data font-semibold tabular-nums text-error">
              {formatRs(order.financials.outstanding)}
            </span>
          </div>

          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Payment Method</span>
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="h-9 rounded border border-outline-variant bg-surface px-2.5 font-body-default text-body-default text-on-surface focus:border-primary focus:outline-none"
            >
              {PAYMENT_METHODS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Amount Received (Rs.)</span>
            <input
              type="number"
              min="1"
              max={order.financials.outstanding}
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-9 rounded border border-outline-variant bg-surface px-2.5 font-mono-data text-mono-data text-on-surface focus:border-primary focus:outline-none"
            />
          </label>

          {!canSubmit && numericAmount > 0 ? (
            <div className="font-mono-data-sm text-mono-data-sm text-error">
              Amount cannot exceed the outstanding balance.
            </div>
          ) : null}

          {error ? (
            <div className="rounded border border-error-container bg-error-container/40 px-3 py-2 font-mono-data-sm text-mono-data-sm text-error">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-outline-variant bg-surface-container-high/40 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded border border-outline-variant bg-surface px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-row-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="h-8 rounded bg-primary px-3.5 font-body-medium text-body-medium text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Confirm Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
