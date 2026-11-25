"use client";

import { useState } from "react";
import type { Supplier } from "../../suppliers/types";
import { PAYMENT_METHODS } from "../constants";
import {
  PURCHASE_AMOUNT_VIEWS,
  type PurchaseAmountView,
} from "../purchaseData";
import type { PurchaseFinancials } from "../types";
import { formatRs, paymentTermsLabel } from "../utils";

type PurchaseSummaryCardProps = {
  totals: PurchaseFinancials;
  paidAmount: number;
  unitsLabel: string;
  freight: number;
  onFreightChange: (value: number) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  selectedSupplier: Supplier | null;
  onPreview: () => void;
  paymentAmount: number;
  onPaymentAmountChange: (value: number) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
};

export function PurchaseSummaryCard({
  totals,
  paidAmount,
  unitsLabel,
  freight,
  onFreightChange,
  notes,
  onNotesChange,
  selectedSupplier,
  onPreview,
  paymentAmount,
  onPaymentAmountChange,
  paymentMethod,
  onPaymentMethodChange,
}: PurchaseSummaryCardProps) {
  const [amountView, setAmountView] = useState<PurchaseAmountView>("Remaining Amount");
  const remainingAmount = Math.max(totals.total - paidAmount, 0);
  const selectedAmount = amountView === "Paid Amount" ? paidAmount : remainingAmount;

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/70 pb-3">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Purchase Summary</h2>
        <span className="rounded-md border border-outline-variant bg-surface-container px-2.5 py-1 font-label-caps text-label-caps uppercase text-on-surface-variant">
          Draft
        </span>
      </div>

      <div className="flex flex-col gap-3 font-body-default text-body-default">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-on-surface">Subtotal</span>
            <span className="font-body-dense text-body-dense text-on-surface-variant">{unitsLabel}</span>
          </div>
          <span className="font-mono-data text-mono-data font-medium text-on-surface">
            {formatRs(totals.subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-on-surface">Total Discount</span>
          <span className="font-mono-data text-mono-data font-medium text-error">
            - {formatRs(totals.discount)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-on-surface">Sales Tax</span>
            <span className="font-body-dense text-body-dense text-on-surface-variant">FBR GST (18%)</span>
          </div>
          <span className="font-mono-data text-mono-data font-medium text-on-surface">
            {formatRs(totals.tax)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-on-surface">Shipping / Freight Inward</span>
          <input
            type="number"
            min={0}
            value={freight}
            onChange={(event) => onFreightChange(Math.max(Number(event.target.value) || 0, 0))}
            aria-label="Shipping or freight inward"
            className="h-9 w-32 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 text-right font-mono-data text-mono-data text-on-surface outline-none transition duration-200 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="mt-2 flex flex-col gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              Grand Total
            </span>
            <div className="flex items-baseline gap-1.5 text-on-surface">
              <span className="font-mono-data text-mono-data text-on-surface-variant">Rs.</span>
              <span className="font-mono-data text-metric-display font-semibold leading-tight tracking-tight">
                {totals.total.toLocaleString("en-PK")}
              </span>
            </div>
          </div>
          <span className="text-right font-body-dense text-body-dense text-on-surface-variant">
            Pakistani Rupee (PKR)
          </span>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/70 pt-3">
            <label
              htmlFor="purchase-amount-view"
              className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant"
            >
              Amount View
            </label>
            <select
              id="purchase-amount-view"
              value={amountView}
              onChange={(event) => setAmountView(event.target.value as PurchaseAmountView)}
              className="h-8 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PURCHASE_AMOUNT_VIEWS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-baseline justify-between gap-3 pt-1">
            <span className="font-body-dense text-body-dense text-on-surface-variant">{amountView}</span>
            <span
              className={`font-mono-data text-headline-sm font-semibold ${
                amountView === "Paid Amount" ? "text-primary" : "text-error"
              }`}
            >
              {formatRs(selectedAmount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              Record Payment
            </span>
            <button
              type="button"
              onClick={() => onPaymentAmountChange(remainingAmount)}
              disabled={remainingAmount <= 0}
              className="h-8 rounded-lg border border-outline-variant bg-surface-container px-3 font-body-medium text-body-medium text-primary transition duration-200 hover:bg-surface-container-high active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pay Full Remaining
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={0}
              max={remainingAmount}
              value={paymentAmount}
              onChange={(event) =>
                onPaymentAmountChange(Math.max(Number(event.target.value) || 0, 0))
              }
              aria-label="Payment amount"
              placeholder="0"
              className="h-10 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-right font-mono-data text-mono-data text-on-surface outline-none transition duration-200 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary"
            />
            <select
              aria-label="Payment method"
              value={paymentMethod}
              onChange={(event) => onPaymentMethodChange(event.target.value)}
              className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface outline-none transition duration-200 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary"
            >
              {PAYMENT_METHODS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 font-body-dense text-body-dense text-on-surface-variant">
            <span>Remaining after payment</span>
            <span className="font-mono-data text-mono-data">
              {formatRs(Math.max(remainingAmount - paymentAmount, 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-primary/15 bg-primary-fixed/20 p-3">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-primary">
          info
        </span>
        <p className="font-body-dense text-body-dense text-on-surface">
          Stock will be added only when goods are received.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/60 bg-surface-container p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Supplier Ledger
          </span>
          {selectedSupplier ? (
            <a
              href={`/suppliers/${selectedSupplier.id}`}
              className="rounded-md font-body-medium text-body-medium text-primary transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Supplier Detail →
            </a>
          ) : (
            <span className="font-body-dense text-body-dense text-on-surface-variant">
              Select a supplier
            </span>
          )}
        </div>
        <p className="font-body-default text-body-default font-medium text-tertiary">
          {selectedSupplier
            ? `Outstanding with this supplier: ${formatRs(selectedSupplier.outstanding)}`
            : "Outstanding will appear after choosing a supplier"}
        </p>
        <div className="pt-1 font-body-dense text-body-dense text-on-surface-variant">
          {selectedSupplier
            ? `Terms: ${paymentTermsLabel(selectedSupplier.paymentTerms)} · Hub: ${
                selectedSupplier.hub || selectedSupplier.region
              }`
            : "Terms and hub are filled automatically from the supplier ledger."}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-outline-variant/70 pt-4">
        <label className="flex flex-col gap-2">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Operational Notes &amp; Dispatch Instructions
          </span>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
            placeholder="Deliver to warehouse…"
            className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-lowest p-3 font-body-default text-body-default text-on-surface outline-none transition duration-200 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary"
          />
        </label>

        <button
          type="button"
          onClick={onPreview}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          <span>Preview PO Document</span>
        </button>
      </div>
    </div>
  );
}
