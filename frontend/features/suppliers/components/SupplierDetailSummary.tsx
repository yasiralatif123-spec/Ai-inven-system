"use client";

import type { SupplierFinancials } from "../supplierDetailData";
import { formatNumber, formatRs } from "../utils";
import {
  PROFILE_CARD,
  PROFILE_METRIC_GRID,
  ProfileBadge,
  ProfileMetric,
} from "../../profiles/profile-ui";

type SupplierDetailSummaryProps = {
  financials: SupplierFinancials;
};

export function SupplierDetailSummary({ financials }: SupplierDetailSummaryProps) {
  return (
    <section className={`${PROFILE_CARD} overflow-hidden`}>
      <div className={PROFILE_METRIC_GRID}>
        <ProfileMetric
          label="Total Purchased"
          value={formatRs(financials.totalPurchased)}
          caption={`${formatNumber(financials.purchaseOrders)} purchase orders to date`}
        />
        <ProfileMetric
          label="Amount Paid"
          value={formatRs(financials.amountPaid)}
          valueTone="success"
          accessory={
            <span className="flex items-center gap-1 font-mono-data-sm text-mono-data-sm text-secondary">
              <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
              <span>{financials.termsLabel}</span>
            </span>
          }
        />
        <ProfileMetric
          label="Remaining Payable"
          value={formatRs(financials.remainingPayable)}
          valueTone="error"
          surface="error"
          accessory={
            <ProfileBadge tone="error">Due {financials.dueDate}</ProfileBadge>
          }
        />
        <ProfileMetric
          label="Last Payment"
          value={financials.lastPaymentDate}
          valueTone="neutral"
          caption={`${formatRs(financials.lastPaymentAmount)} · Voucher #${financials.lastPaymentVoucher}`}
        />
      </div>
      <div className="border-t border-outline-variant px-4 py-2 font-mono-data-sm text-mono-data-sm text-error/90">
        {financials.overdueNote}
      </div>
    </section>
  );
}
