"use client";

import type { SalesOrder } from "../../sales-orders/types";
import { formatRs } from "../utils";
import { formatProfileDate, getPaymentBadgeClasses } from "../profile";
import {
  PROFILE_CARD,
  PROFILE_ID_TOKEN,
  PROFILE_NUMERIC,
  PROFILE_TABLE_HEAD,
  PROFILE_TABLE_ROW,
  ProfileBadge,
  ProfileEmptyState,
} from "../../profiles/profile-ui";

type CustomerInvoicesProps = {
  orders: SalesOrder[];
  onViewOrder: (order: SalesOrder) => void;
  onPay: (order: SalesOrder) => void;
};

export function CustomerInvoices({ orders, onViewOrder, onPay }: CustomerInvoicesProps) {
  if (orders.length === 0) {
    return (
      <div className={PROFILE_CARD}>
        <ProfileEmptyState
          icon="receipt_long"
          title="No invoices recorded"
          description="Invoices appear here as soon as a sale order is saved for this customer."
        />
      </div>
    );
  }

  return (
    <div className={`${PROFILE_CARD} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className={PROFILE_TABLE_HEAD}>
              <th className="px-3 py-2">Invoice / Order</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Paid</th>
              <th className="px-3 py-2 text-right">Outstanding</th>
              <th className="px-3 py-2 text-center">Payment</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-body-default text-body-default text-on-surface">
            {orders.map((order) => (
              <tr key={order.id} className={PROFILE_TABLE_ROW}>
                <td className="px-3 py-2.5">
                  <span className={PROFILE_ID_TOKEN}>{order.id}</span>
                  <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
                    {order.items
                      .slice(0, 2)
                      .map((item) => item.name)
                      .join(", ")}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono-data-sm text-mono-data-sm text-secondary">
                  {formatProfileDate(order.createdAt)}
                </td>
                <td className={`${PROFILE_NUMERIC} whitespace-nowrap px-3 py-2.5 text-right font-semibold`}>
                  {formatRs(order.financials.total)}
                </td>
                <td className={`${PROFILE_NUMERIC} whitespace-nowrap px-3 py-2.5 text-right text-primary`}>
                  {formatRs(order.financials.paid)}
                </td>
                <td className={`${PROFILE_NUMERIC} whitespace-nowrap px-3 py-2.5 text-right text-warning`}>
                  {formatRs(order.financials.outstanding)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ProfileBadge tone="none" className={getPaymentBadgeClasses(order.paymentStatus)}>
                    {order.paymentLabel || order.paymentStatus}
                  </ProfileBadge>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onViewOrder(order)}
                      title={`View ${order.id}`}
                      aria-label={`View ${order.id}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                    </button>
                    <button
                      type="button"
                      disabled={order.financials.outstanding <= 0}
                      onClick={() => onPay(order)}
                      title={`Record payment for ${order.id}`}
                      aria-label={`Record payment for ${order.id}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-container-high hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[17px]">payments</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
