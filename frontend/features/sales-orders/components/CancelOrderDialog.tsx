"use client";

import { useState } from "react";
import type { SalesOrder } from "../types";
import { formatRs, getPaymentClasses, getStatusClasses } from "../utils";

type CancelOrderDialogProps = {
  order: SalesOrder | null;
  cancelling: boolean;
  onClose: () => void;
  onConfirm: (order: SalesOrder) => Promise<void>;
};

export function CancelOrderDialog({
  order,
  cancelling,
  onClose,
  onConfirm,
}: CancelOrderDialogProps) {
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const delivered = order.status === "Delivered";

  async function handleConfirm() {
    if (!order || cancelling) return;
    setError(null);
    try {
      await onConfirm(order);
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Failed to cancel sale order. Please try again."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-overlay/40 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-sale-title"
        className="relative w-full max-w-lg rounded border border-error-container bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-outline-variant bg-error-container/30 px-4 py-3">
          <span className="material-symbols-outlined mt-0.5 text-[20px] text-error">warning</span>
          <div className="flex-1">
            <h2 id="cancel-sale-title" className="font-headline-md text-headline-md text-on-surface">
              Cancel Sale Order
            </h2>
            <p className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
              Cancellation is terminal and cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cancel confirmation"
            disabled={cancelling}
            className="flex h-7 w-7 items-center justify-center rounded text-secondary transition-colors hover:bg-row-hover hover:text-on-surface disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3 p-4">
          <p className="font-body-default text-body-dense leading-relaxed text-on-surface-variant">
            You are about to cancel the following sale order. Please review the stock and payment
            effects before confirming.
          </p>

          <div className="rounded border border-outline-variant bg-surface-container-low p-3">
            <div className="flex items-center justify-between border-b border-outline-variant/70 pb-2">
              <span className="font-mono-data font-medium text-primary">#{order.id}</span>
              <span
                className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-label-caps uppercase ${getStatusClasses(order.status)}`}
              >
                {order.status}
              </span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 font-mono-data-sm text-mono-data-sm">
              <div>
                <dt className="text-secondary">Customer</dt>
                <dd className="font-body-medium text-body-dense text-on-surface">{order.customer}</dd>
              </div>
              <div>
                <dt className="text-secondary">Order Amount</dt>
                <dd className="font-semibold tabular-nums text-on-surface">{formatRs(order.amount)}</dd>
              </div>
              <div>
                <dt className="text-secondary">Outstanding</dt>
                <dd className="tabular-nums text-error">{formatRs(order.financials.outstanding)}</dd>
              </div>
              <div>
                <dt className="text-secondary">Payment</dt>
                <dd>
                  <span
                    className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-label-caps uppercase ${getPaymentClasses(order.paymentStatus)}`}
                  >
                    {order.paymentLabel}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div
            className={`rounded border px-3 py-2 font-body-dense text-body-dense leading-relaxed ${
              delivered
                ? "border-error-container bg-error-container/40 text-error"
                : "border-outline-variant bg-surface-container text-on-surface-variant"
            }`}
          >
            {delivered
              ? "This order is Delivered. Goods have already reached the customer, so stock will NOT be restored to inventory."
              : "Stock for eligible, non-delivered items will be restored to inventory exactly once."}
          </div>

          <ul className="list-disc space-y-1.5 pl-5 font-body-dense text-body-dense leading-relaxed text-on-surface-variant">
            <li>Cancelled orders cannot be edited, reactivated, or paid afterwards.</li>
            <li>Delivered orders never have their stock restored.</li>
            <li>
              Payments already recorded are not automatically refunded. Process any refund separately.
            </li>
          </ul>

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
            disabled={cancelling}
            className="h-8 rounded border border-outline-variant bg-surface px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-row-hover disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={cancelling}
            className="h-8 rounded bg-error px-3.5 font-body-medium text-body-medium text-on-error transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {cancelling ? "Cancelling..." : "Cancel Sale Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
