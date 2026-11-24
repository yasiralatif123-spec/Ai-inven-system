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
    <div className="flex flex-col rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel lg:col-span-7">
      <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">Recent Orders</span>
          <span className="rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            {totals.today} today
          </span>
        </div>
        <Link
          href="/sales-orders"
          className="flex items-center gap-1 rounded-md px-2 py-1 font-body-medium text-body-medium text-primary transition duration-200 hover:bg-surface-container hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <span>View all sales</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left font-body-default text-body-default">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="px-4 py-3 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Order
              </th>
              <th className="px-4 py-3 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Customer
              </th>
              <th className="px-4 py-3 text-right font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Amount
              </th>
              <th className="px-4 py-3 text-center font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Status
              </th>
              <th className="px-4 py-3 text-right font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Terms
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  </div>
                  <div className="mt-3 font-body-medium text-body-medium text-on-surface">
                    No sale orders recorded
                  </div>
                  <div className="mt-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                    Create a sale order to populate this ledger.
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-surface-container-low">
                  <td className="px-4 py-3">
                    <span className="rounded-md border border-outline-variant bg-surface-variant px-2 py-1 font-mono-data-sm text-mono-data-sm font-medium text-on-surface">
                      #{order.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body-medium text-body-medium text-on-surface">
                    {order.customer}
                    <span className="block font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      {order.location}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-data text-mono-data font-medium text-on-surface">
                    {formatRs(order.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium ${getStatusClasses(order.status)}`}
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
                    className={`px-4 py-3 text-right font-mono-data-sm text-mono-data-sm ${
                      order.paymentStatus === "unpaid" ? "text-error" : "text-on-surface-variant"
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

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant bg-surface-container-low px-5 py-3 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
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
