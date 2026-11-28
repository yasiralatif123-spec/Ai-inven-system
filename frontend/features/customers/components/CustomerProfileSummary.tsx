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
  const { headroom, exposure, availableCredit, creditStatus, overLimit, warning } =
    getCustomerFinancials(customer);
  const hasLimit = customer.creditLimit > 0;

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
            label="Opening Balance"
            value={formatRs(customer.openingBalance)}
            caption="Carry-forward balance at account creation"
            valueTone="primary"
          />
          <ProfileMetric
            label="Current Outstanding"
            value={formatRs(customer.outstanding)}
            caption="Due current billing cycle"
            valueTone="warning"
          />
          <div className="flex min-w-0 flex-col gap-1 bg-surface-container-lowest px-4 py-3.5 lg:py-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Credit Limit
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                {paymentTermsLabel(customer.paymentTerms)}
              </span>
            </div>
            <div className="font-metric-display text-metric-display font-semibold tracking-tight tabular-nums text-on-surface">
              {hasLimit ? formatRs(customer.creditLimit) : "No Limit Set"}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 border-t border-outline-variant/70 pt-2">
              <span className="font-body-dense text-body-dense text-secondary">
                Available Credit
              </span>
              <span
                className={`font-mono-data-sm text-mono-data-sm tabular-nums ${
                  hasLimit && availableCredit > 0 ? "font-medium text-success" : "text-secondary"
                }`}
              >
                {hasLimit ? formatRs(availableCredit) : "No Limit Set"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-outline-variant px-4 py-3">
          {hasLimit ? (
            <>
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
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-1 font-mono-data-sm text-mono-data-sm">
              <span className="font-body-medium text-on-surface">No credit limit set</span>
              <span className="text-secondary">Credit-limit alerts are disabled</span>
            </div>
          )}
        </div>
      </div>

      {hasLimit && warning ? (
        <div className="flex flex-col gap-3 rounded-lg border border-warning-border bg-warning-container/40 p-3.5 text-on-surface sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-warning">
              warning
            </span>
            <p className="font-body-default text-body-dense leading-snug text-warning">
              <strong className="font-body-medium">
                {creditStatus === "exceeded" ? "Credit Limit Exceeded:" : "Near Credit Limit:"}
              </strong>{" "}
              Current exposure
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
