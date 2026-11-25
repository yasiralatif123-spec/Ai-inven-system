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
    <section className="grid w-full grid-cols-1 divide-y divide-outline-variant/70 rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel md:grid-cols-4 md:divide-x md:divide-y-0">
      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Total Purchases
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-container text-on-surface-variant">
            <span className="material-symbols-outlined text-[17px]">receipt_long</span>
          </span>
        </div>
        <div className="mt-3 font-metric-display text-metric-display tracking-tight text-on-surface">
          {formatRs(totalPurchases)}
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          Across {purchases.length} saved purchase order{purchases.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Pending Delivery
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-container text-on-surface-variant">
            <span className="material-symbols-outlined text-[17px]">local_shipping</span>
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight text-on-surface">
            {pendingDelivery}
          </span>
          <span className="font-body-dense text-body-dense text-on-surface-variant">
            Purchase Orders
          </span>
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          Awaiting goods receipt note
        </div>
      </div>

      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Partially Received
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-tertiary-fixed/40 text-tertiary">
            <span className="material-symbols-outlined text-[17px]">inventory</span>
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight text-tertiary">
            {partiallyReceived}
          </span>
          <span className="font-body-dense text-body-dense text-on-surface-variant">
            Awaiting reconciliation
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 font-body-dense text-body-dense text-tertiary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-tertiary" />
          Inspection GRN pending signoff
        </div>
      </div>

      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <select
            aria-label="Amount view"
            value={amountView}
            onChange={(event) => setAmountView(event.target.value as PurchaseAmountView)}
            className="h-8 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 font-label-caps text-label-caps uppercase text-on-surface-variant transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            {PURCHASE_AMOUNT_VIEWS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="shrink-0 rounded-md border border-error/20 bg-error-container/30 px-2 py-1 font-label-caps text-label-caps uppercase text-on-error-container">
            {amountView === "Paid Amount" ? "Ledger Total" : "Aging Alert"}
          </span>
        </div>
        <div
          className={`mt-3 font-metric-display text-metric-display tracking-tight ${
            amountView === "Paid Amount" ? "text-primary" : "text-error"
          }`}
        >
          {formatRs(selectedAmount)}
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          {amountView === "Paid Amount"
            ? "Recorded across saved purchase ledger"
            : "Outstanding across saved purchase ledger"}
        </div>
      </div>
    </section>
  );
}
