"use client";

import type { PurchaseRecord } from "../purchaseData";
import { formatRs } from "../utils";

type DeletePurchaseDialogProps = {
  purchase: PurchaseRecord | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: (purchase: PurchaseRecord) => void;
};

export function DeletePurchaseDialog({
  purchase,
  deleting,
  onClose,
  onConfirm,
}: DeletePurchaseDialogProps) {
  if (!purchase) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-overlay/40 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-purchase-title"
        className="relative w-full max-w-md rounded border border-error-container bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-outline-variant bg-error-container/30 px-4 py-3">
          <span className="material-symbols-outlined mt-0.5 text-[20px] text-error">warning</span>
          <div className="flex-1">
            <h2 id="delete-purchase-title" className="font-headline-md text-headline-md text-on-surface">
              Delete Purchase
            </h2>
            <p className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
              This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close delete confirmation"
            className="flex h-7 w-7 items-center justify-center rounded text-secondary transition-colors hover:bg-row-hover hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3 p-4">
          <p className="font-body-dense text-body-dense leading-relaxed text-on-surface-variant">
            You are about to permanently delete this purchase order and its payment ledger from
            MongoDB.
          </p>

          <div className="rounded border border-outline-variant bg-surface-container-low p-3">
            <div className="flex items-center justify-between border-b border-outline-variant/70 pb-2">
              <span className="font-mono-data font-medium text-primary">{purchase.id}</span>
              <span className="rounded bg-surface-container px-2 py-0.5 font-label-caps text-label-caps uppercase text-secondary">
                {purchase.status}
              </span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 font-mono-data-sm text-mono-data-sm">
              <div>
                <dt className="text-secondary">Supplier</dt>
                <dd className="font-body-medium text-body-dense text-on-surface">
                  {purchase.supplier}
                </dd>
              </div>
              <div>
                <dt className="text-secondary">Purchase Date</dt>
                <dd className="text-on-surface">{purchase.date}</dd>
              </div>
              <div>
                <dt className="text-secondary">Invoice</dt>
                <dd className="text-on-surface">{purchase.invoiceNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-secondary">Total</dt>
                <dd className="font-medium text-on-surface">{formatRs(purchase.total)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-outline-variant bg-surface-container-high/40 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="h-8 rounded border border-outline-variant bg-surface px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-row-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(purchase)}
            disabled={deleting}
            className="h-8 rounded bg-error px-3.5 font-body-medium text-body-medium text-on-error transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
}
