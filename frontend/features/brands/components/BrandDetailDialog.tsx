"use client";

import { useEffect } from "react";
import type { Brand } from "../types";
import { formatBrandDate, formatProductCount } from "../utils";

type BrandDetailDialogProps = {
  brand: Brand;
  busy: boolean;
  onClose: () => void;
  onEdit: (brand: Brand) => void;
  onToggleStatus: (brand: Brand) => void;
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <span className="break-words font-body-default text-body-default text-on-surface">
        {value}
      </span>
    </div>
  );
}

export function BrandDetailDialog({
  brand,
  busy,
  onClose,
  onEdit,
  onToggleStatus,
}: BrandDetailDialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, busy]);

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close brand details"
        className="absolute inset-0 cursor-default bg-inverse-surface/50 backdrop-blur-[2px]"
        onClick={() => {
          if (!busy) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-detail-title"
        className="relative z-10 flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel"
      >
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-5 py-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="brand-detail-title" className="font-headline-md text-headline-md tracking-tight text-on-surface">
                {brand.name}
              </h2>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-1 font-label-caps text-label-caps ${
                  brand.isActive
                    ? "border-primary/20 bg-primary-fixed/30 text-primary"
                    : "border-outline-variant bg-surface-container text-on-surface-variant"
                }`}
              >
                {brand.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              {formatProductCount(brand.productCount)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition duration-200 hover:bg-row-hover hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Brand Name" value={brand.name} />
            <DetailItem label="Status" value={brand.isActive ? "Active" : "Inactive"} />
            <DetailItem label="Created Date" value={formatBrandDate(brand.createdAt)} />
            <DetailItem label="Last Updated" value={formatBrandDate(brand.updatedAt)} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              Description
            </span>
            <p className="whitespace-pre-line font-body-default text-body-default text-on-surface-variant">
              {brand.description || "No description provided."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant bg-surface-container-low px-5 py-3">
          <button
            type="button"
            onClick={() => onToggleStatus(brand)}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-medium text-body-medium text-on-surface transition duration-200 hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[17px]">
              {brand.isActive ? "toggle_off" : "toggle_on"}
            </span>
            {brand.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            onClick={() => onEdit(brand)}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[17px]">edit</span>
            Edit Brand
          </button>
        </div>
      </div>
    </div>
  );
}
