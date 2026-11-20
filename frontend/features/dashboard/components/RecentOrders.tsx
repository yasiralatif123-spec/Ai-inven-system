import Link from "next/link";
import { formatRs } from "../../../app/inventory/utils";
import { getPaymentClasses, getStatusClasses } from "../../sales-orders/utils";
import type { RecentOrder } from "../types";

type RecentOrdersProps = {
  orders: RecentOrder[];
  totals: {
    today: number;
    all: number;
    outstanding: number;
    outstandingCount: number;
  };
};

export function RecentOrders({ orders, totals }: RecentOrdersProps) {
  return (
    <div className="flex flex-col rounded border border-outline-variant bg-surface-container-lowest lg:col-span-7">
      <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-headline-md text-headline-md text-on-surface">Recent Orders</span>
          <span className="rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
            {totals.today} today
          </span>
        </div>
        <Link
          href="/sales-orders"
          className="flex items-center gap-1 font-body-medium text-body-medium text-primary hover:underline"
        >
          <span>View all sales</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left font-body-default text-body-default">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="px-3 py-2.5 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Order
              </th>
              <th className="px-3 py-2.5 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Customer
              </th>
              <th className="px-3 py-2.5 text-right font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Amount
              </th>
              <th className="px-3 py-2.5 text-center font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Status
              </th>
              <th className="px-3 py-2.5 text-right font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Terms
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-secondary">
                    <span className="material-symbols-outlined text-[19px]">receipt_long</span>
                  </div>
                  <div className="mt-2 font-body-medium text-body-medium text-on-surface">
                    No sale orders recorded
                  </div>
                  <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
                    Create a sale order to populate this ledger.
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-surface-container-low">
                  <td className="px-3 py-2.5">
                    <span className="rounded border border-outline-variant bg-surface-variant px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm font-medium text-on-surface">
                      #{order.id}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-body-medium text-body-medium text-on-surface">
                    {order.customer}
                    <span className="block font-mono-data-sm text-mono-data-sm text-secondary">
                      {order.location}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono-data text-mono-data font-medium text-on-surface">
                    {formatRs(order.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${getStatusClasses(order.status)}`}
                    >
                      {order.status}
                    </span>
                    <span
                      className={`mt-1 block text-[10px] uppercase tracking-wide ${getPaymentClasses(order.paymentStatus)}`}
                    >
                      {order.paymentLabel}
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-mono-data-sm text-mono-data-sm ${
                      order.paymentStatus === "unpaid" ? "text-error" : "text-secondary"
                    }`}
                  >
                    {order.terms}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-4 py-2 font-mono-data-sm text-mono-data-sm text-secondary">
        <span>
          Showing {orders.length} of {totals.today} orders today ({totals.all} total)
        </span>
        <span>
          Outstanding {formatRs(totals.outstanding)} across {totals.outstandingCount} orders
        </span>
      </div>
    </div>
  );
}
