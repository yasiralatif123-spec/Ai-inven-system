"use client";

import { PURCHASE_FORM_STATUSES } from "../constants";
import type { CreatePurchaseStatus } from "../types";

type CreatePurchaseHeaderProps = {
  purchaseCode: string;
  saving: boolean;
  mode: "create" | "edit";
  status: CreatePurchaseStatus;
  onStatusChange: (status: CreatePurchaseStatus) => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onSavePurchase: () => void;
};

export function CreatePurchaseHeader({
  purchaseCode,
  saving,
  mode,
  status,
  onStatusChange,
  onCancel,
  onSaveDraft,
  onSavePurchase,
}: CreatePurchaseHeaderProps) {
  const legacyStatus = PURCHASE_FORM_STATUSES.includes(status) ? null : status;
  const statuses = legacyStatus
    ? [...PURCHASE_FORM_STATUSES, legacyStatus]
    : PURCHASE_FORM_STATUSES;

  return (
    <div className="flex flex-col gap-4 border-b border-outline-variant/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          <span>Purchases</span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface">
            {mode === "edit" ? "Edit Purchase" : "Create Purchase"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
            {mode === "edit" ? "Edit Purchase" : "New Purchase"}
          </h1>
          <div className="inline-flex items-center rounded-md border border-outline-variant bg-surface-container px-3 py-1 font-mono-data-sm text-mono-data-sm font-medium text-on-surface-variant">
            {purchaseCode}{" "}
            <span className="ml-1 text-on-surface-variant">
              ({mode === "edit" ? "Edit Mode" : "Draft Mode"})
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="purchase-status"
            className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant"
          >
            Status
          </label>
          <select
            id="purchase-status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as CreatePurchaseStatus)}
            disabled={saving}
            className="h-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface outline-none transition duration-200 hover:border-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container disabled:opacity-50"
          >
            {statuses.map((option) => (
              <option key={option} value={option} disabled={option === legacyStatus}>
                {option}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-9 rounded-lg px-3 font-body-medium text-body-medium text-on-surface-variant transition duration-200 hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className="h-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={onSavePurchase}
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary-container px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary active:translate-y-px active:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[17px]">check</span>
            <span>{saving ? "Saving…" : "Save Purchase"}</span>
          </button>
        </div>
        <p className="font-body-default text-body-default text-on-surface-variant">
          {status === "Received"
            ? "Received adds stock to inventory and products on save."
            : "Stock changes only when status is Received or goods are received."}
        </p>
      </div>
    </div>
  );
}
