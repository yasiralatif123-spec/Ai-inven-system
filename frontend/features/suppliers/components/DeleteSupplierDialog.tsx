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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-overlay/50 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-supplier-title"
        className="relative w-full max-w-md rounded-xl border border-error/20 bg-surface-container-lowest shadow-panel"
      >
        <div className="flex items-start gap-3 border-b border-outline-variant/80 bg-error-container/40 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-error-container/70 text-error">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </span>
          <div className="flex-1">
            <div id="delete-supplier-title" className="font-headline-md text-headline-md text-on-surface">
              Delete Supplier
            </div>
            <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              This action cannot be undone.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close delete confirmation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition duration-200 hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3 p-5">
          <p className="font-body-default text-body-dense text-on-surface-variant">
            You are about to permanently delete this supplier and its payable profile from MongoDB.
          </p>
          <div className="rounded-lg border border-outline-variant/80 bg-surface-container p-4">
            <div className="flex items-center justify-between border-b border-outline-variant/70 pb-2">
              <span className="font-mono-data font-medium text-primary">#{supplier.code}</span>
              <span className="font-body-medium text-body-medium text-on-surface">{supplier.status}</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 font-mono-data-sm text-mono-data-sm">
              <div>
                <dt className="text-on-surface-variant">Supplier</dt>
                <dd className="font-body-medium text-body-dense text-on-surface">{supplier.name}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Contact</dt>
                <dd className="text-on-surface">{supplier.contact}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Phone</dt>
                <dd className="text-on-surface">{supplier.phone}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Outstanding</dt>
                <dd className="font-semibold text-error">{formatRs(supplier.outstanding)}</dd>
              </div>
            </dl>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-error/20 bg-error-container/50 px-3 py-2 font-mono-data-sm text-mono-data-sm text-error">
              <span className="material-symbols-outlined text-[15px]">error_outline</span>
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-outline-variant/80 bg-surface-container-low px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="h-9 rounded-lg bg-error px-4 font-body-medium text-body-medium text-on-error shadow-panel transition duration-200 hover:opacity-90 active:translate-y-px disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
          >
            {submitting ? "Deleting..." : "Delete Supplier"}
          </button>
        </div>
      </div>
    </div>
  );
}
