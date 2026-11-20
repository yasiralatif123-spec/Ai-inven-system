"use client";

import { useState } from "react";
import type { PurchaseRecord } from "../purchaseData";
import type { PurchasePaymentInput } from "../types";
import { formatRs } from "../utils";

type RecordPurchasePaymentDialogProps = {
  purchase: PurchaseRecord | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (purchase: PurchaseRecord, payload: PurchasePaymentInput) => void;
};

const METHODS = ["Cash", "Bank Transfer", "Cheque", "Online Transfer"];

export function RecordPurchasePaymentDialog({
  purchase,
  saving,
  onClose,
  onConfirm,
}: RecordPurchasePaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(METHODS[0]);
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!purchase) return null;

  function submit() {
    const numeric = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError("Enter a payment amount greater than 0.");
      return;
    }
    if (numeric > purchase!.remaining) {
      setError(`Amount cannot exceed the remaining balance of ${purchase!.remaining}.`);
      return;
    }

    setError(null);
    onConfirm(purchase!, { amount: numeric, method, reference });
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-surface-container-lowest p-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-outline-variant pb-3">
          <div>
            <p className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Record Payment
            </p>
            <h2 className="font-headline-md text-headline-md text-on-surface">{purchase.id}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment dialog"
            className="flex h-8 w-8 items-center justify-center rounded text-outline hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mt-4 rounded bg-surface-container p-3 font-body-dense text-body-dense">
          <div className="flex items-center justify-between text-secondary">
            <span>Supplier</span>
            <span className="font-medium text-on-surface">{purchase.supplier}</span>
          </div>
          <div className="flex items-center justify-between text-secondary">
            <span>Remaining balance</span>
            <span className="font-mono-data font-medium text-error">
              {formatRs(purchase.remaining)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps uppercase text-secondary">
              Amount (Rs.)
            </span>
            <input
              type="number"
              min={1}
              max={purchase.remaining}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              className="h-10 rounded border border-outline-variant bg-surface px-3 font-mono-data text-mono-data text-on-surface outline-none focus:border-primary focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Method</span>
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="h-10 rounded border border-outline-variant bg-surface px-3 font-body-default text-body-default text-on-surface outline-none focus:border-primary focus:outline-none"
            >
              {METHODS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps uppercase text-secondary">
              Reference <span className="font-normal text-outline">(optional)</span>
            </span>
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="TRF-12345"
              className="h-10 rounded border border-outline-variant bg-surface px-3 font-mono-data text-mono-data text-on-surface outline-none focus:border-primary focus:outline-none"
            />
          </label>

          {error ? (
            <p className="font-body-dense text-body-dense text-error">{error}</p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-outline-variant pt-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded bg-surface-container px-4 font-body-medium text-body-medium text-on-surface hover:bg-surface-container-high"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="h-9 rounded bg-primary-container px-4 font-body-medium text-body-medium text-on-primary hover:bg-primary disabled:opacity-50"
          >
            {saving ? "Saving…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
