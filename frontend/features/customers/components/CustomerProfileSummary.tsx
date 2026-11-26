"use client";

import type { Customer } from "../types";
import { formatNumber, formatRs } from "../utils";
import { getCustomerFinancials, paymentTermsLabel } from "../profile";
import {
  PROFILE_CARD,
  PROFILE_METRIC_GRID,
  ProfileMetric,
} from "../../profiles/profile-ui";

type CustomerProfileSummaryProps = {
  customer: Customer;
};

export function CustomerProfileSummary({ customer }: CustomerProfileSummaryProps) {
  const { totalPaid, headroom, exposure, overLimit, warning } = getCustomerFinancials(customer);

  return (
    <div className="flex flex-col gap-3">
      <div className={PROFILE_CARD}>
        <div className={PROFILE_METRIC_GRID}>
          <ProfileMetric
            label="Total Purchases"
            value={formatRs(customer.totalPurchases)}
            caption={`${formatNumber(customer.orders)} orders recorded to date`}
          />
          <ProfileMetric
            label="Total Paid"
            value={formatRs(totalPaid)}
            caption="Reconciled bank & cash"
            valueTone="primary"
          />
          <ProfileMetric
            label="Current Outstanding"
            value={formatRs(customer.outstanding)}
            caption="Due current billing cycle"
            valueTone="warning"
          />
          <ProfileMetric
            label="Credit Limit"
            value={formatRs(customer.creditLimit)}
            caption="Authorized wholesale ceiling"
            accessory={
              <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                {paymentTermsLabel(customer.paymentTerms)}
              </span>
            }
          />
        </div>

        <div className="flex flex-col gap-1.5 border-t border-outline-variant px-4 py-3">
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
              className={`h-full rounded ${overLimit ? "bg-error" : "bg-warning"}`}
              style={{ width: `${Math.min(exposure, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {warning ? (
        <div className="flex flex-col gap-3 rounded-lg border border-warning-border bg-warning-container/40 p-3.5 text-on-surface sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-warning">
              warning
            </span>
            <p className="font-body-default text-body-dense leading-snug text-warning">
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
