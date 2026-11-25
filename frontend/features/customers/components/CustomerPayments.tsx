"use client";

import type { SalesOrder } from "../../sales-orders/types";
import { formatRs } from "../utils";
import { formatProfileDate } from "../profile";

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
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded border border-outline-variant bg-surface-container-lowest p-6 text-center">
        <span className="material-symbols-outlined text-[28px] text-secondary">payments</span>
        <div className="mt-2 font-body-medium text-body-medium text-on-surface">No payments recorded</div>
        <div className="mt-1 font-body-dense text-body-dense text-secondary">
          Payments saved against this customer&apos;s orders will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <div className="divide-y divide-border">
        {payments.map((order) => (
          <div
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-row-hover"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-mono-data text-mono-data font-medium">
                  {order.id}
                </span>
                <span className="font-body-medium text-body-medium text-on-surface">
                  {order.paymentMethod || "Cash"}
                </span>
              </div>
              <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                {formatProfileDate(order.createdAt)} · Outstanding {formatRs(order.financials.outstanding)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono-data text-mono-data font-semibold tabular-nums text-primary">
                {formatRs(order.financials.paid)}
              </span>
              <button
                type="button"
                onClick={() => onViewOrder(order)}
                title={`View ${order.id}`}
                aria-label={`View ${order.id}`}
                className="rounded p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
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
