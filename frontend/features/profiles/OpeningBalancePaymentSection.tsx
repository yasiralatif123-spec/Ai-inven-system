"use client";

import { useState, type KeyboardEvent } from "react";
import { OPENING_BALANCE_PAYMENT_METHODS } from "./constants";
import type {
  OpeningBalancePaymentInput,
  OpeningBalancePaymentRecord,
} from "./types";

type OpeningBalancePaymentSectionProps = {
  openingBalance: number;
  openingBalancePaid: number;
  remainingOpeningBalance: number;
  payments: OpeningBalancePaymentRecord[];
  onSubmit: (input: OpeningBalancePaymentInput) => Promise<void>;
};

function newPaymentKey() {
  const uuid = globalThis.crypto?.randomUUID?.();
  return `ob_payment_${uuid ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
}

function formatRs(value: number): string {
  return `Rs ${Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function OpeningBalancePaymentSection({
  openingBalance,
  openingBalancePaid,
  remainingOpeningBalance,
  payments,
  onSubmit,
}: OpeningBalancePaymentSectionProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>(OPENING_BALANCE_PAYMENT_METHODS[0]);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = Number(amount);
  const invalidAmount = amount.trim() !== "" && (!Number.isFinite(numericAmount) || numericAmount <= 0);
  const exceedsRemaining = numericAmount > remainingOpeningBalance;
  const canSubmit =
    !invalidAmount && numericAmount > 0 && !exceedsRemaining && !submitting;
  const previewRemaining = Math.max(remainingOpeningBalance - (numericAmount || 0), 0);

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        amount: numericAmount,
        method,
        reference: reference.trim(),
        idempotencyKey: newPaymentKey(),
      });
      setAmount("");
      setReference("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to record the opening balance payment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const recentPayments = Array.isArray(payments) ? payments.slice(-5).reverse() : [];

  return (
    <section className="rounded-xl border border-outline-variant/80 bg-surface-container-low p-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">
            Opening Balance Payment
          </h3>
          <p className="mt-0.5 font-body-dense text-body-dense text-on-surface-variant">
            Recorded separately from sale and purchase payments.
          </p>
        </div>
        <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-outline-variant/70 bg-surface-container-lowest px-3 py-2">
          <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Total Opening Balance
          </div>
          <div className="font-mono-data text-mono-data font-semibold tabular-nums text-on-surface">
            {formatRs(openingBalance)}
          </div>
        </div>
        <div className="rounded-lg border border-outline-variant/70 bg-surface-container-lowest px-3 py-2">
          <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Received / Paid
          </div>
          <div className="font-mono-data text-mono-data font-semibold tabular-nums text-primary">
            {formatRs(openingBalancePaid)}
          </div>
        </div>
        <div className="rounded-lg border border-outline-variant/70 bg-surface-container-lowest px-3 py-2">
          <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Remaining Opening Balance
          </div>
          <div className="font-mono-data text-mono-data font-semibold tabular-nums text-error">
            {formatRs(remainingOpeningBalance)}
          </div>
        </div>
      </div>

      {/* This section lives inside the dialog's profile <form>. A nested <form>
          is invalid HTML and breaks hydration, so use a plain container and
          handle Enter explicitly without submitting the parent form. */}
      <div
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key !== "Enter") return;
          if ((event.target as HTMLElement).tagName === "BUTTON") return;
          event.preventDefault();
          event.stopPropagation();
          void handleSubmit();
        }}
        className="grid grid-cols-1 gap-2 sm:grid-cols-4"
      >
        <label className="flex flex-col gap-1 sm:col-span-1">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Amount
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            max={remainingOpeningBalance}
            step="0.01"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setError(null);
            }}
            className="h-9 w-full rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 font-mono-data text-mono-data text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-1">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Method
          </span>
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            className="h-9 w-full cursor-pointer rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {OPENING_BALANCE_PAYMENT_METHODS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-1">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Reference
          </span>
          <input
            value={reference}
            onChange={(event) => {
              setReference(event.target.value);
              setError(null);
            }}
            maxLength={120}
            placeholder="Receipt / voucher"
            className="h-9 w-full rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <div className="flex flex-col justify-end sm:col-span-1">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="h-9 rounded-lg bg-primary px-3 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Payment"}
          </button>
        </div>
      </div>

      <div className="mt-2 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
        Preview after payment: {formatRs(previewRemaining)} remaining
      </div>

      {invalidAmount || exceedsRemaining ? (
        <div className="mt-2 font-mono-data-sm text-mono-data-sm text-error">
          {invalidAmount
            ? "Enter an amount greater than zero."
            : "Amount cannot exceed the remaining opening balance."}
        </div>
      ) : null}

      {error ? (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-error/20 bg-error-container/50 px-3 py-2 font-body-dense text-body-dense text-error">
          <span className="material-symbols-outlined text-[16px]">error_outline</span>
          {error}
        </div>
      ) : null}

      {recentPayments.length > 0 ? (
        <div className="mt-3 border-t border-outline-variant/70 pt-2">
          <div className="mb-1 font-label-caps text-label-caps uppercase text-on-surface-variant">
            Recent Payment History
          </div>
          <div className="flex flex-col divide-y divide-outline-variant/60">
            {recentPayments.map((payment) => {
              const isReversal = payment.kind === "reversal";
              return (
                <div
                  key={payment._id || payment.idempotencyKey}
                  className="flex items-center justify-between gap-2 py-1.5 font-body-dense text-body-dense"
                >
                  <div className="min-w-0">
                    <div className="truncate text-on-surface">
                      {isReversal ? "Reversal" : "Payment"} · {payment.method || "Cash"}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </div>
                    <div className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      {formatDate(payment.paidAt)} · {payment.createdBy || "System"}
                    </div>
                  </div>
                  <div
                    className={`font-mono-data text-mono-data tabular-nums ${
                      isReversal ? "text-error" : "text-primary"
                    }`}
                  >
                    {isReversal ? "-" : "+"}
                    {formatRs(payment.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
