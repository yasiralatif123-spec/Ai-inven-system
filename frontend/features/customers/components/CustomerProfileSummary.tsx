"use client";

import type { SalesOrder } from "../../sales-orders/types";
import type { Customer } from "../types";
import { formatNumber, formatRs } from "../utils";
import { getCustomerFinancials, paymentTermsLabel } from "../profile";

type CustomerProfileSummaryProps = {
  customer: Customer;
  orders?: SalesOrder[];
};

export function CustomerProfileSummary({ customer, orders = [] }: CustomerProfileSummaryProps) {
  const { headroom, exposure, overLimit, warning } = getCustomerFinancials(customer);
  const totalPaid = orders.length
    ? orders.reduce((sum, order) => sum + Math.max(order.financials.paid, 0), 0)
    : Math.max(customer.totalPurchases - customer.outstanding, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded border border-outline-variant bg-surface-container-lowest p-4">
        <div className="grid grid-cols-2 divide-y divide-outline-variant md:grid-cols-4 md:divide-x md:divide-y-0">
          <div className="flex flex-col gap-1 pb-3 md:pb-0 md:pr-4">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Total Purchases
            </span>
            <div className="font-metric-display text-metric-display tabular-nums text-on-surface">
              {formatRs(customer.totalPurchases)}
            </div>
            <div className="font-mono-data-sm text-mono-data-sm text-secondary">
              {formatNumber(customer.orders)} orders recorded to date
            </div>
          </div>

          <div className="flex flex-col gap-1 pt-3 md:px-4 md:pt-0">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Total Paid
            </span>
            <div className="font-metric-display text-metric-display tabular-nums text-[#186a57]">
              {formatRs(totalPaid)}
            </div>
            <div className="font-mono-data-sm text-mono-data-sm text-secondary">
              Reconciled bank &amp; cash
            </div>
          </div>

          <div className="flex flex-col gap-1 pt-3 md:px-4 md:pt-0">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Current Outstanding
            </span>
            <div className="font-metric-display text-metric-display tabular-nums text-[#b47818]">
              {formatRs(customer.outstanding)}
            </div>
            <div className="font-mono-data-sm text-mono-data-sm text-secondary">
              Due current billing cycle
            </div>
          </div>

          <div className="flex flex-col gap-1 pt-3 md:pl-4 md:pt-0">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Credit Limit
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                {paymentTermsLabel(customer.paymentTerms)}
              </span>
            </div>
            <div className="font-metric-display text-metric-display tabular-nums text-on-surface">
              {formatRs(customer.creditLimit)}
            </div>
            <div className="font-mono-data-sm text-mono-data-sm text-secondary">
              Authorized wholesale ceiling
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1.5 border-t border-outline-variant pt-3">
          <div className="flex flex-wrap items-center justify-between gap-1 font-mono-data-sm text-mono-data-sm">
            <span className="font-body-medium text-on-surface">
              Credit Line Exposure: {exposure}%
            </span>
            <span className="text-secondary">
              {overLimit
                ? `${formatRs(Math.abs(headroom))} over approved limit`
                : `${formatRs(headroom)} headroom remaining`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded bg-surface-container-high">
            <div
              className={`h-full rounded ${overLimit ? "bg-error" : "bg-[#d97706]"}`}
              style={{ width: `${Math.min(exposure, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {warning ? (
        <div className="flex flex-col gap-3 rounded border border-[#f4d5a2] bg-[#fef9f2] p-3.5 text-on-surface sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-[#b47818]">
              warning
            </span>
            <p className="font-body-default text-body-dense leading-snug text-[#6a4300]">
              <strong className="font-body-medium">Credit Limit Warning:</strong> Current exposure
              of {formatRs(customer.outstanding)} is {exposure}% of the approved{" "}
              {formatRs(customer.creditLimit)} ceiling.{" "}
              {overLimit
                ? `This account is ${formatRs(Math.abs(headroom))} over its approved limit.`
                : `Only ${formatRs(headroom)} headroom remains.`}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
