"use client";

import { useState } from "react";
import type { SalesOrder } from "../types";
import { formatNumber, getPaymentClasses, getStatusClasses } from "../utils";
import { OrderActionsMenu } from "./OrderActionsMenu";

type OrdersTableProps = {
  orders: SalesOrder[];
  onEdit: (order: SalesOrder) => void;
  onDelete: (order: SalesOrder) => void;
  onRecordPayment: (id: string) => void;
  onOpenCustomer: (order: SalesOrder) => void;
};

function itemLabel(order: SalesOrder): string {
  return order.skuCount === 1 ? "SKU" : "SKUs";
}

export function OrdersTable({
  orders,
  onEdit,
  onDelete,
  onRecordPayment,
  onOpenCustomer,
}: OrdersTableProps) {
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visibleOrders = orders.slice(start, start + pageSize);
  const allChecked = orders.length > 0 && orders.every((order) => checkedIds.includes(order.id));

  function toggleChecked(id: string) {
    setCheckedIds((current) =>
      current.includes(id) ? current.filter((checkedId) => checkedId !== id) : [...current, id]
    );
  }

  function toggleAll() {
    setCheckedIds(allChecked ? [] : orders.map((order) => order.id));
  }

  return (
    <div className="flex flex-col overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-label-caps uppercase text-secondary">Orders Ledger</span>
          <span className="text-outline-variant">/</span>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Live Dispatch Queue</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">Sorted by Time (Desc)</span>
          <button
            type="button"
            title="Back to first page"
            aria-label="Back to first page"
            onClick={() => {
              setPage(1);
              setOpenMenuId(null);
            }}
            className="flex items-center text-secondary transition-colors hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-8 border-b border-outline-variant bg-surface-container-high/60 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              <th className="w-8 px-3 text-center">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Select all orders"
                  className="h-3.5 w-3.5 cursor-pointer rounded border-outline text-primary focus:ring-0"
                />
              </th>
              <th className="px-2.5 py-1.5 font-label-caps">ORDER #</th>
              <th className="px-2.5 py-1.5 font-label-caps">TIME</th>
              <th className="px-2.5 py-1.5 font-label-caps">CUSTOMER &amp; LOCATION</th>
              <th className="px-2.5 py-1.5 text-right font-label-caps">ITEMS</th>
              <th className="px-2.5 py-1.5 text-right font-label-caps">AMOUNT (RS.)</th>
              <th className="px-2.5 py-1.5 text-center font-label-caps">PAYMENT</th>
              <th className="px-2.5 py-1.5 text-center font-label-caps">STATUS</th>
              <th className="w-28 px-2 py-1.5 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-body-default text-body-dense text-on-surface">
            {visibleOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-secondary">
                    <span className="material-symbols-outlined text-[19px]">filter_alt_off</span>
                  </div>
                  <div className="mt-2 font-body-medium text-body-medium text-on-surface">No orders found</div>
                  <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
                    Try a different search, status, payment, hub, or date.
                  </div>
                </td>
              </tr>
            ) : (
              visibleOrders.map((order) => {
                return (
                  <tr
                    key={order.id}
                    onClick={() => onOpenCustomer(order)}
                    title={`Open customer profile for ${order.customer}`}
                    className="cursor-pointer transition-colors hover:bg-surface-container"
                  >
                    <td
                      onClick={(event) => event.stopPropagation()}
                      className="px-3 py-2 text-center"
                    >
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(order.id)}
                        onChange={() => toggleChecked(order.id)}
                        aria-label={`Select ${order.id}`}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-outline text-primary focus:ring-0"
                      />
                    </td>
                    <td className="px-2.5 py-2">
                      <span className="font-mono-data text-on-surface">#{order.id}</span>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 font-mono-data-sm text-secondary">{order.time}</td>
                    <td className="px-2.5 py-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenCustomer(order);
                        }}
                        title={`Open profile for ${order.customer}`}
                        className="font-body-medium leading-tight text-on-surface transition-colors hover:text-primary hover:underline"
                      >
                        {order.customer}
                      </button>
                      <div className="font-mono-data-sm text-[10px] text-secondary">{order.location}</div>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-right font-mono-data-sm tabular-nums">
                      {order.skuCount} {itemLabel(order)} <span className="text-secondary">({order.unitCount}u)</span>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-right font-mono-data font-medium tabular-nums">
                      {formatNumber(order.amount)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-center">
                      <span
                        className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-label-caps uppercase ${getPaymentClasses(order.paymentStatus)}`}
                      >
                        {order.paymentLabel}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-center">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[10px] font-label-caps uppercase ${getStatusClasses(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td
                      onClick={(event) => event.stopPropagation()}
                      className="px-2 py-2 text-center"
                    >
                      <OrderActionsMenu
                        order={order}
                        open={openMenuId === order.id}
                        onToggle={() =>
                          setOpenMenuId((current) => (current === order.id ? null : order.id))
                        }
                        onEdit={(selected) => {
                          setOpenMenuId(null);
                          onEdit(selected);
                        }}
                        onDelete={(selected) => {
                          setOpenMenuId(null);
                          onDelete(selected);
                        }}
                        onRecordPayment={(id) => {
                          setOpenMenuId(null);
                          onRecordPayment(id);
                        }}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant bg-surface-container-low px-3.5 py-2.5 font-mono-data-sm text-mono-data-sm text-secondary">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-on-surface">{orders.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, orders.length)}</strong> of{" "}
            <strong className="text-on-surface">{orders.length}</strong> orders
          </span>
          <span className="text-outline-variant">|</span>
          <label className="flex items-center gap-1">
            Rows per page:
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
                setOpenMenuId(null);
              }}
              className="rounded border border-outline-variant bg-surface px-1.5 py-0.5 text-on-surface focus:outline-none"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => {
              setPage((current) => Math.max(1, current - 1));
              setOpenMenuId(null);
            }}
            className="flex h-6 w-6 items-center justify-center rounded border border-outline-variant bg-surface transition-colors hover:bg-surface-container disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[14px]">chevron_left</span>
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => {
                setPage(pageNumber);
                setOpenMenuId(null);
              }}
              className={`h-6 w-6 rounded border font-mono-data-sm text-mono-data-sm ${
                pageNumber === currentPage
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline-variant bg-surface transition-colors hover:bg-surface-container"
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage === totalPages}
            onClick={() => {
              setPage((current) => Math.min(totalPages, current + 1));
              setOpenMenuId(null);
            }}
            className="flex h-6 w-6 items-center justify-center rounded border border-outline-variant bg-surface transition-colors hover:bg-surface-container disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
