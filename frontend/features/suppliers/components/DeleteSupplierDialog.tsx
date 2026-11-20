"use client";

import { useState } from "react";
import type { Supplier } from "../types";
import { formatRs } from "../utils";

type DeleteSupplierDialogProps = {
  supplier: Supplier;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteSupplierDialog({
  supplier,
  onClose,
  onConfirm,
}: DeleteSupplierDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await onConfirm();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete supplier. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-supplier-title"
        className="relative w-full max-w-md rounded border border-error-container bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-outline-variant bg-error-container/30 px-4 py-3">
          <span className="material-symbols-outlined mt-0.5 text-[20px] text-error">warning</span>
          <div className="flex-1">
            <div id="delete-supplier-title" className="font-headline-md text-headline-md text-on-surface">
              Delete Supplier
            </div>
            <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
              This action cannot be undone.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close delete confirmation"
            className="flex h-7 w-7 items-center justify-center rounded text-secondary transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3 p-4">
          <p className="font-body-default text-body-dense text-on-surface-variant">
            You are about to permanently delete this supplier and its payable profile from MongoDB.
          </p>
          <div className="rounded border border-outline-variant bg-surface-container-low p-3">
            <div className="flex items-center justify-between border-b border-outline-variant/70 pb-2">
              <span className="font-mono-data font-medium text-primary">#{supplier.code}</span>
              <span className="font-body-medium text-body-medium text-on-surface">{supplier.status}</span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 font-mono-data-sm text-mono-data-sm">
              <div>
                <dt className="text-secondary">Supplier</dt>
                <dd className="font-body-medium text-body-dense text-on-surface">{supplier.name}</dd>
              </div>
              <div>
                <dt className="text-secondary">Contact</dt>
                <dd className="text-on-surface">{supplier.contact}</dd>
              </div>
              <div>
                <dt className="text-secondary">Phone</dt>
                <dd className="text-on-surface">{supplier.phone}</dd>
              </div>
              <div>
                <dt className="text-secondary">Outstanding</dt>
                <dd className="text-error">{formatRs(supplier.outstanding)}</dd>
              </div>
            </dl>
          </div>

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
            className="h-8 rounded border border-outline-variant bg-surface px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="h-8 rounded bg-error px-3.5 font-body-medium text-body-medium text-on-error transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Deleting..." : "Delete Supplier"}
          </button>
        </div>
      </div>
    </div>
  );
}
