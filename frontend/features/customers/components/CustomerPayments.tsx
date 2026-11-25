"use client";

import type { SalesOrder } from "../../sales-orders/types";
import { formatRs } from "../utils";
import { formatProfileDate } from "../profile";
import {
  PROFILE_CARD,
  PROFILE_ID_TOKEN,
  PROFILE_NUMERIC,
  PROFILE_TABLE_ROW,
  ProfileEmptyState,
} from "../../profiles/profile-ui";

type CustomerPaymentsProps = {
  orders: SalesOrder[];
  onViewOrder: (order: SalesOrder) => void;
};

export function CustomerPayments({ orders, onViewOrder }: CustomerPaymentsProps) {
  const payments = orders
    .filter((order) => order.financials.paid > 0)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  if (payments.length === 0) {
    return (
      <div className={PROFILE_CARD}>
        <ProfileEmptyState
          icon="payments"
          title="No payments recorded"
          description="Payments saved against this customer's orders will appear here."
        />
      </div>
    );
  }

  return (
    <div className={`${PROFILE_CARD} overflow-hidden`}>
      <div className="divide-y divide-border">
        {payments.map((order) => (
          <div key={order.id} className={`${PROFILE_TABLE_ROW} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={PROFILE_ID_TOKEN}>{order.id}</span>
                <span className="font-body-medium text-body-medium text-on-surface">
                  {order.paymentMethod || "Cash"}
                </span>
              </div>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                {formatProfileDate(order.createdAt)} · Outstanding {formatRs(order.financials.outstanding)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`${PROFILE_NUMERIC} font-semibold text-primary`}>
                {formatRs(order.financials.paid)}
              </span>
              <button
                type="button"
                onClick={() => onViewOrder(order)}
                title={`View ${order.id}`}
                aria-label={`View ${order.id}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
              >
                <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
