"use client";

import { useMemo, useState } from "react";
import type { PaymentStatus, SalesOrder } from "../../sales-orders/types";
import { formatFlavors } from "../../../app/lib/flavors";
import { formatRs } from "../utils";
import {
  formatProfileDate,
  getFulfillmentBadgeClasses,
  getPaymentBadgeClasses,
} from "../profile";

type CustomerOrdersLedgerProps = {
  orders: SalesOrder[];
  onViewOrder: (order: SalesOrder) => void;
};

type PaymentFilter = "all" | PaymentStatus;

const FILTERS: Array<{ value: PaymentFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "unpaid", label: "Unpaid" },
];

const PAGE_SIZE = 8;

function exportOrders(orders: SalesOrder[]) {
  const rows = [
    ["Order ID", "Booking Date", "Manifest Items", "Order Amount", "Payment", "Fulfillment"],
    ...orders.map((order) => [
      order.id,
      formatProfileDate(order.createdAt),
      `${order.unitCount} units (${order.items
        .map(
          (item) =>
            `${item.name}${formatFlavors(item.flavor) ? ` · ${formatFlavors(item.flavor)}` : ""} · ${item.quantity} × ${item.unitPrice} = ${item.lineTotal}`
        )
        .join(", ")})`,
      String(order.amount),
      order.paymentStatus,
      order.status,
    ]),
  ];

  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `customer-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function CustomerOrdersLedger({ orders, onViewOrder }: CustomerOrdersLedgerProps) {
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return orders.filter((order) => {
      if (paymentFilter !== "all" && order.paymentStatus !== paymentFilter) return false;
      if (!term) return true;

      return [
        order.id,
        order.createdAt,
        ...order.items.map((item) => `${item.name} ${item.sku} ${formatFlavors(item.flavor)}`),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [orders, paymentFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded border border-outline-variant bg-surface-container-lowest p-2.5">
        <div className="relative flex min-w-[220px] flex-1 items-center">
          <span className="material-symbols-outlined pointer-events-none absolute left-2.5 text-[17px] text-outline">
            search
          </span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search order ID, SKU or date…"
            className="h-8 w-full max-w-sm rounded border border-outline-variant bg-surface pl-8 pr-3 font-body-default text-body-default text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 font-mono-data-sm text-mono-data-sm">
          <span className="px-1 text-label-caps uppercase text-secondary">Filter:</span>
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setPaymentFilter(filter.value);
                setPage(1);
              }}
              className={`rounded border px-2.5 py-1 font-body-medium ${
                paymentFilter === filter.value
                  ? "border-outline-variant bg-surface-container-highest text-primary"
                  : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {filter.label}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-outline-variant" />
          <button
            type="button"
            onClick={() => exportOrders(filtered)}
            title="Export Ledger"
            aria-label="Export order ledger"
            className="flex h-[30px] items-center rounded border border-outline-variant bg-surface px-2 text-secondary hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="h-8 border-b border-outline-variant bg-surface-container-low font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                <th className="px-3.5 py-2">Order ID</th>
                <th className="px-3 py-2">Booking Date</th>
                <th className="px-3 py-2">Manifest Items</th>
                <th className="px-3 py-2 text-right">Order Amount</th>
                <th className="px-3 py-2 text-center">Payment</th>
                <th className="px-3 py-2 text-center">Fulfillment</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-default text-body-default text-on-surface">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="font-body-medium text-body-medium text-on-surface">
                      No saved orders match this view
                    </div>
                    <div className="mt-1 font-body-dense text-body-dense text-secondary">
                      Orders for this customer appear here as they are created in Sales &amp; Orders.
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-[#faf9f7]">
                    <td className="px-3.5 py-2.5">
                      <span className="rounded border border-outline-variant bg-[#f2efeb] px-1.5 py-0.5 font-mono-data text-mono-data font-medium">
                        {order.id}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono-data-sm text-mono-data-sm text-secondary">
                      {formatProfileDate(order.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-mono-data-sm text-mono-data-sm text-secondary">
                        {order.unitCount} units
                      </div>
                      <div className="mt-1 flex flex-col gap-1">
                        {order.items.map((item, index) => (
                          <div
                            key={`${item.sku || item.name}-${index}`}
                            className="rounded border border-outline-variant/70 bg-surface-container-low px-1.5 py-1"
                          >
                            <div className="font-body-dense text-body-dense font-medium text-on-surface">
                              {item.name}
                              {item.sku ? (
                                <span className="ml-1 font-mono-data-sm text-mono-data-sm text-secondary">
                                  · {item.sku}
                                </span>
                              ) : null}
                            </div>
                            <div className="font-mono-data-sm text-mono-data-sm text-secondary">
                              {formatFlavors(item.flavor) || "No flavors"} · {item.quantity} ×{" "}
                              {formatRs(item.unitPrice)} = {formatRs(item.lineTotal)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono-data text-mono-data font-semibold tabular-nums">
                      {formatRs(order.amount)}
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
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getFulfillmentBadgeClasses(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewOrder(order)}
                        title={`View order ${order.id}`}
                        aria-label={`View order ${order.id}`}
                        className="rounded p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-outline-variant bg-surface-container-low px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">
            Showing {start} to {end} of {filtered.length} orders
          </span>
          <div className="flex items-center gap-1 font-mono-data-sm text-mono-data-sm">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded border border-outline-variant bg-surface px-2.5 py-1 text-secondary disabled:opacity-50"
            >
              Prev
            </button>
            <span className="rounded bg-primary-container px-2.5 py-1 font-medium text-white">
              {currentPage}
            </span>
            <span className="px-1 text-secondary">of {totalPages}</span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="rounded border border-outline-variant bg-surface px-2.5 py-1 text-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
