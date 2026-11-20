"use client";

import type { SupplierFinancials } from "../supplierDetailData";
import { formatNumber, formatRs } from "../utils";

type SupplierDetailSummaryProps = {
  financials: SupplierFinancials;
};

export function SupplierDetailSummary({ financials }: SupplierDetailSummaryProps) {
  return (
    <section className="w-full rounded border border-outline-variant bg-surface-container-lowest">
      <div className="grid grid-cols-1 divide-y divide-outline-variant sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
        <div className="flex flex-col justify-between p-3.5 lg:p-4">
          <div className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            Total Purchased
          </div>
          <div className="font-metric-display text-metric-display font-semibold tracking-tight text-on-surface">
            {formatRs(financials.totalPurchased)}
          </div>
          <div className="font-mono-data-sm text-mono-data-sm text-secondary">
            {formatNumber(financials.purchaseOrders)} purchase orders to date
          </div>
        </div>

        <div className="flex flex-col justify-between p-3.5 lg:p-4">
          <div className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            Amount Paid
          </div>
          <div className="font-metric-display text-metric-display font-semibold tracking-tight text-[#2E7D58]">
            {formatRs(financials.amountPaid)}
          </div>
          <div className="mt-1 flex items-center gap-1 font-mono-data-sm text-mono-data-sm text-secondary">
            <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
            <span>{financials.termsLabel}</span>
          </div>
        </div>

        <div className="flex flex-col justify-between bg-error-container/20 p-3.5 lg:p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-label-caps text-label-caps font-semibold uppercase tracking-wider text-error">
              Remaining Payable
            </span>
            <span className="rounded border border-error/20 bg-error-container px-1.5 py-0.5 font-mono-data-sm text-[10px] font-semibold uppercase text-on-error-container">
              Due {financials.dueDate}
            </span>
          </div>
          <div className="font-metric-display text-metric-display font-semibold tracking-tight text-error">
            {formatRs(financials.remainingPayable)}
          </div>
          <div className="mt-1 font-mono-data-sm text-mono-data-sm text-error/90">
            {financials.overdueNote}
          </div>
        </div>

        <div className="flex flex-col justify-between p-3.5 lg:p-4">
          <div className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            Last Payment
          </div>
          <div className="font-headline-xl text-headline-xl font-medium tracking-tight text-on-surface">
            {financials.lastPaymentDate}
          </div>
          <div className="mt-1 font-mono-data-sm text-mono-data-sm text-secondary">
            {formatRs(financials.lastPaymentAmount)} · Voucher #{financials.lastPaymentVoucher}
          </div>
        </div>
      </div>
    </section>
  );
}
