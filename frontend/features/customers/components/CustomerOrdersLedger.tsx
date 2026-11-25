"use client";

import { useMemo, useState } from "react";
import type { PaymentStatus, SalesOrder } from "../../sales-orders/types";
import { priceBasisLabel } from "../../../app/lib/units";
import { formatRs } from "../utils";
import {
  formatProfileDate,
  getFulfillmentBadgeClasses,
  getPaymentBadgeClasses,
} from "../profile";
import {
  PROFILE_BUTTON_ICON,
  PROFILE_CARD,
  PROFILE_ID_TOKEN,
  PROFILE_NUMERIC,
  PROFILE_TABLE_HEAD,
  PROFILE_TABLE_ROW,
  ProfileBadge,
  ProfileEmptyState,
} from "../../profiles/profile-ui";

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
            `${item.name} · ${item.quantity} ${priceBasisLabel(item.unitLabel)} × ${item.unitPrice} / ${priceBasisLabel(item.unitLabel)} = ${item.lineTotal}`
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
        ...order.items.map((item) => `${item.name} ${item.sku}`),
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
      <div className={`${PROFILE_CARD} flex flex-wrap items-center justify-between gap-2.5 p-2.5`}>
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
            className="h-8 w-full max-w-sm rounded-lg border border-outline-variant bg-surface pl-8 pr-3 font-body-default text-body-default text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono-data-sm text-mono-data-sm">
          <span className="px-1 text-label-caps uppercase text-secondary">Filter:</span>
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setPaymentFilter(filter.value);
                setPage(1);
              }}
              className={`rounded-lg border border-outline-variant px-2.5 py-1 font-body-medium transition-colors ${
                paymentFilter === filter.value
                  ? "bg-primary-container/60 text-primary"
                  : "bg-surface text-on-surface-variant hover:bg-row-hover"
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
            className={PROFILE_BUTTON_ICON}
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
          </button>
        </div>
      </div>

      <div className={`${PROFILE_CARD} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse text-left">
            <thead>
              <tr className={PROFILE_TABLE_HEAD}>
                <th className="px-3.5 py-2">Order ID</th>
                <th className="px-3 py-2">Booking Date</th>
                <th className="px-3 py-2">Manifest Items</th>
                <th className="px-3 py-2 text-right">Order Amount</th>
                <th className="px-3 py-2 text-center">Payment</th>
                <th className="px-3 py-2 text-center">Fulfillment</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-body-default text-body-default text-on-surface">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <ProfileEmptyState
                      compact
                      icon="receipt_long"
                      title="No saved orders match this view"
                      description="Orders for this customer appear here as they are created in Sales & Orders."
                    />
                  </td>
                </tr>
              ) : (
                paged.map((order) => (
                  <tr key={order.id} className={PROFILE_TABLE_ROW}>
                    <td className="px-3.5 py-2.5">
                      <span className={PROFILE_ID_TOKEN}>{order.id}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono-data-sm text-mono-data-sm text-secondary">
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
                              {item.quantity} {priceBasisLabel(item.unitLabel)} × {formatRs(item.unitPrice)} / {priceBasisLabel(item.unitLabel)} = {formatRs(item.lineTotal)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className={`${PROFILE_NUMERIC} whitespace-nowrap px-3 py-2.5 text-right font-semibold`}>
                      {formatRs(order.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <ProfileBadge tone="none" className={getPaymentBadgeClasses(order.paymentStatus)}>
                        {order.paymentLabel || order.paymentStatus}
                      </ProfileBadge>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <ProfileBadge tone="none" className={getFulfillmentBadgeClasses(order.status)}>
                        {order.status}
                      </ProfileBadge>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewOrder(order)}
                        title={`View order ${order.id}`}
                        aria-label={`View order ${order.id}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
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
              className="rounded-lg border border-outline-variant bg-surface px-2.5 py-1 text-secondary transition-colors hover:bg-row-hover disabled:opacity-50"
            >
              Prev
            </button>
            <span className="rounded-lg bg-primary px-2.5 py-1 font-medium text-on-primary">
              {currentPage}
            </span>
            <span className="px-1 text-secondary">of {totalPages}</span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="rounded-lg border border-outline-variant bg-surface px-2.5 py-1 text-secondary transition-colors hover:bg-row-hover disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
