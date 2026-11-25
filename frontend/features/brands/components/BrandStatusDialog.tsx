"use client";

import { useEffect } from "react";
import type { Brand } from "../types";
import { formatProductCount } from "../utils";

type BrandStatusDialogProps = {
  brand: Brand;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function BrandStatusDialog({
  brand,
  busy,
  onClose,
  onConfirm,
}: BrandStatusDialogProps) {
  const activating = !brand.isActive;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, busy]);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation"
        className="absolute inset-0 cursor-default bg-inverse-surface/50 backdrop-blur-[2px]"
        onClick={() => {
          if (!busy) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-status-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel"
      >
        <div className="flex flex-col gap-2 px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">
              {activating ? "toggle_on" : "toggle_off"}
            </span>
            <h2 id="brand-status-title" className="font-headline-md text-headline-md tracking-tight text-on-surface">
              {activating ? "Activate brand?" : "Deactivate brand?"}
            </h2>
          </div>
          <p className="font-body-default text-body-default text-on-surface-variant">
            {activating
              ? `${brand.name} will be available again when adding or editing products.`
              : `${brand.name} will be hidden from new product selection.`}
          </p>
          {!activating && brand.productCount > 0 ? (
            <div className="rounded-lg border border-error/20 bg-error-container/20 px-3 py-2 font-body-dense text-body-dense text-error">
              This brand is assigned to {formatProductCount(brand.productCount)}. Deactivating it does not remove or reassign those products.
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-outline-variant bg-surface-container-low px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-9 items-center rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-medium text-body-medium text-on-surface transition duration-200 hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex h-9 items-center rounded-lg bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            {busy ? "Updating..." : activating ? "Activate" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}
