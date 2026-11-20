"use client";

import type { Supplier } from "../../suppliers/types";
import type { PurchaseFinancials } from "../types";
import { formatRs, paymentTermsLabel } from "../utils";

type PurchaseSummaryCardProps = {
  totals: PurchaseFinancials;
  unitsLabel: string;
  freight: number;
  onFreightChange: (value: number) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  selectedSupplier: Supplier | null;
  onPreview: () => void;
};

export function PurchaseSummaryCard({
  totals,
  unitsLabel,
  freight,
  onFreightChange,
  notes,
  onNotesChange,
  selectedSupplier,
  onPreview,
}: PurchaseSummaryCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2">
        <h2 className="font-headline-md text-headline-md text-on-surface">Purchase Summary</h2>
        <span className="rounded bg-secondary-container px-2 py-0.5 font-label-caps text-label-caps uppercase text-on-secondary-container">
          Draft
        </span>
      </div>

      <div className="flex flex-col gap-2.5 font-body-default text-body-default">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-on-surface">Subtotal</span>
            <span className="font-mono-data-sm text-mono-data-sm text-secondary">{unitsLabel}</span>
          </div>
          <span className="font-mono-data font-medium text-on-surface">
            {formatRs(totals.subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-on-surface">Total Discount</span>
          <span className="font-mono-data font-medium text-error">- {formatRs(totals.discount)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-on-surface">Sales Tax</span>
            <span className="font-mono-data-sm text-mono-data-sm text-secondary">FBR GST (18%)</span>
          </div>
          <span className="font-mono-data font-medium text-on-surface">
            {formatRs(totals.tax)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-on-surface">Shipping / Freight Inward</span>
          <input
            type="number"
            min={0}
            value={freight}
            onChange={(event) => onFreightChange(Math.max(Number(event.target.value) || 0, 0))}
            aria-label="Shipping or freight inward"
            className="h-8 w-28 rounded bg-surface-container-lowest px-2 text-right font-mono-data text-mono-data text-on-surface outline-none focus:ring-1 focus:ring-primary-container"
          />
        </div>

        <div className="mt-2 flex flex-col gap-1 rounded bg-surface-container-low p-3">
          <div className="flex items-baseline justify-between">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Grand Total
            </span>
            <div className="flex items-baseline gap-1 text-on-surface">
              <span className="font-mono-data text-mono-data text-secondary">Rs.</span>
              <span className="font-mono-data text-[24px] font-bold leading-tight tracking-tight">
                {totals.total.toLocaleString("en-PK")}
              </span>
            </div>
          </div>
          <span className="text-right font-mono-data-sm text-mono-data-sm text-secondary">
            Pakistani Rupee (PKR)
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded bg-surface-container-high p-2.5">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[17px] text-primary">
          info
        </span>
        <p className="font-body-dense text-body-dense text-on-surface">
          Stock will be added only when goods are received.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 rounded bg-surface-container p-3">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            Supplier Ledger
          </span>
          {selectedSupplier ? (
            <a
              href={`/suppliers/${selectedSupplier.id}`}
              className="font-body-dense text-body-dense font-medium text-primary hover:underline"
            >
              Supplier Detail →
            </a>
          ) : (
            <span className="font-body-dense text-body-dense text-outline">Select a supplier</span>
          )}
        </div>
        <p className="font-body-default text-body-default font-medium text-tertiary">
          {selectedSupplier
            ? `Outstanding with this supplier: ${formatRs(selectedSupplier.outstanding)}`
            : "Outstanding will appear after choosing a supplier"}
        </p>
        <div className="pt-1 font-mono-data-sm text-mono-data-sm text-secondary">
          {selectedSupplier
            ? `Terms: ${paymentTermsLabel(selectedSupplier.paymentTerms)} · Hub: ${
                selectedSupplier.hub || selectedSupplier.region
              }`
            : "Terms and hub are filled automatically from the supplier ledger."}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-outline-variant pt-3">
        <label className="flex flex-col gap-1">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            Operational Notes &amp; Dispatch Instructions
          </span>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
            placeholder="Deliver to warehouse…"
            className="w-full resize-none rounded bg-surface-container-lowest p-2.5 font-body-default text-body-default text-on-surface outline-none focus:ring-1 focus:ring-primary-container"
          />
        </label>

        <button
          type="button"
          onClick={onPreview}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded bg-surface-container-lowest font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[17px]">print</span>
          <span>Preview PO Document</span>
        </button>
      </div>
    </div>
  );
}
