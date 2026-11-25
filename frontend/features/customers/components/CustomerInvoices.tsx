"use client";

import type { SalesOrder } from "../../sales-orders/types";
import { formatRs } from "../utils";
import { formatProfileDate, getPaymentBadgeClasses } from "../profile";

type CustomerInvoicesProps = {
  orders: SalesOrder[];
  onViewOrder: (order: SalesOrder) => void;
  onPay: (order: SalesOrder) => void;
};

export function CustomerInvoices({ orders, onViewOrder, onPay }: CustomerInvoicesProps) {
  if (orders.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded border border-outline-variant bg-surface-container-lowest p-6 text-center">
        <span className="material-symbols-outlined text-[28px] text-secondary">receipt_long</span>
        <div className="mt-2 font-body-medium text-body-medium text-on-surface">No invoices recorded</div>
        <div className="mt-1 font-body-dense text-body-dense text-secondary">
          Invoices appear here as soon as a sale order is saved for this customer.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-8 border-b border-outline-variant bg-surface-container-low font-label-caps text-label-caps uppercase tracking-wider text-secondary">
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
              <tr key={order.id} className="transition-colors hover:bg-row-hover">
                <td className="px-3 py-2.5">
                  <span className="rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-mono-data text-mono-data font-medium">
                    {order.id}
                  </span>
                  <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
                    {order.items
                      .slice(0, 2)
                      .map((item) => item.name)
                      .join(", ")}
                  </div>
                </td>
                <td className="px-3 py-2.5 font-mono-data-sm text-mono-data-sm text-secondary">
                  {formatProfileDate(order.createdAt)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono-data text-mono-data font-semibold tabular-nums">
                  {formatRs(order.financials.total)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono-data text-mono-data tabular-nums text-primary">
                  {formatRs(order.financials.paid)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono-data text-mono-data tabular-nums text-warning">
                  {formatRs(order.financials.outstanding)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getPaymentBadgeClasses(
                      order.paymentStatus
                    )}`}
                  >
                    {order.paymentLabel || order.paymentStatus}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onViewOrder(order)}
                      title={`View ${order.id}`}
                      aria-label={`View ${order.id}`}
                      className="rounded p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                    </button>
                    <button
                      type="button"
                      disabled={order.financials.outstanding <= 0}
                      onClick={() => onPay(order)}
                      title={`Record payment for ${order.id}`}
                      aria-label={`Record payment for ${order.id}`}
                      className="rounded p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
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
