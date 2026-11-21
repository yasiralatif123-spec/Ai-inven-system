"use client";

import { useState } from "react";
import {
  PURCHASE_AMOUNT_VIEWS,
  type PurchaseAmountView,
  type PurchaseRecord,
} from "../purchaseData";
import { formatRs } from "../utils";

type PurchasesSummaryProps = {
  purchases: PurchaseRecord[];
};

export function PurchasesSummary({ purchases }: PurchasesSummaryProps) {
  const [amountView, setAmountView] = useState<PurchaseAmountView>("Remaining Amount");
  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const paidAmount = purchases.reduce((sum, purchase) => sum + purchase.paid, 0);
  const unpaidBalance = purchases.reduce((sum, purchase) => sum + purchase.remaining, 0);
  const selectedAmount = amountView === "Paid Amount" ? paidAmount : unpaidBalance;
  const pendingDelivery = purchases.filter(
    (purchase) => purchase.status === "Ordered" || purchase.status === "Partially Received"
  ).length;
  const partiallyReceived = purchases.filter(
    (purchase) => purchase.status === "Partially Received"
  ).length;

  return (
    <section className="grid w-full grid-cols-1 divide-y divide-outline-variant rounded border border-outline-variant bg-surface-container-lowest md:grid-cols-4 md:divide-x md:divide-y-0">
      <div className="flex flex-col justify-between px-4 py-3">
        <div className="flex items-center justify-between text-secondary">
          <span className="font-label-caps text-label-caps uppercase tracking-wider">
            Total Purchases
          </span>
          <span className="material-symbols-outlined text-[16px] text-outline">receipt_long</span>
        </div>
        <div className="mt-1 font-metric-display text-metric-display tracking-tight text-on-surface">
          {formatRs(totalPurchases)}
        </div>
        <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
          Across {purchases.length} saved purchase order{purchases.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex flex-col justify-between px-4 py-3">
        <div className="flex items-center justify-between text-secondary">
          <span className="font-label-caps text-label-caps uppercase tracking-wider">
            Pending Delivery
          </span>
          <span className="material-symbols-outlined text-[16px] text-outline">local_shipping</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight text-on-surface">
            {pendingDelivery}
          </span>
          <span className="font-body-dense text-secondary">Purchase Orders</span>
        </div>
        <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
          Awaiting goods receipt note
        </div>
      </div>

      <div className="flex flex-col justify-between px-4 py-3">
        <div className="flex items-center justify-between text-secondary">
          <span className="font-label-caps text-label-caps uppercase tracking-wider">
            Partially Received
          </span>
          <span className="material-symbols-outlined text-[16px] text-tertiary">inventory</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight text-tertiary">
            {partiallyReceived}
          </span>
          <span className="font-body-dense text-secondary">Awaiting reconciliation</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 font-mono-data-sm text-mono-data-sm text-tertiary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-tertiary" />
          Inspection GRN pending signoff
        </div>
      </div>

      <div className="flex flex-col justify-between bg-error-container/20 px-4 py-3">
        <div className="flex items-center justify-between gap-2 text-secondary">
          <select
            aria-label="Amount view"
            value={amountView}
            onChange={(event) => setAmountView(event.target.value as PurchaseAmountView)}
            className="h-7 min-w-0 flex-1 rounded border border-outline-variant bg-surface-container-lowest px-1.5 font-label-caps text-label-caps uppercase text-secondary focus:border-primary-container focus:outline-none"
          >
            {PURCHASE_AMOUNT_VIEWS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="shrink-0 rounded border border-error/30 bg-error-container px-1.5 py-0.5 font-label-caps text-[10px] uppercase text-on-error-container">
            {amountView === "Paid Amount" ? "Ledger Total" : "Aging Alert"}
          </span>
        </div>
        <div
          className={`mt-1 font-metric-display text-metric-display tracking-tight ${
            amountView === "Paid Amount" ? "text-primary" : "text-error"
          }`}
        >
          {formatRs(selectedAmount)}
        </div>
        <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
          {amountView === "Paid Amount"
            ? "Recorded across saved purchase ledger"
            : "Outstanding across saved purchase ledger"}
        </div>
      </div>
    </section>
  );
}
