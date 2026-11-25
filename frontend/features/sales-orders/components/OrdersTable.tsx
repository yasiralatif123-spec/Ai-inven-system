"use client";

import { useState } from "react";
import type { SalesOrder } from "../types";
import { formatNumber, getPaymentClasses, getStatusClasses } from "../utils";
import { OrderActionsMenu } from "./OrderActionsMenu";

type OrdersTableProps = {
  orders: SalesOrder[];
  onEdit: (order: SalesOrder) => void;
  onDelete: (order: SalesOrder) => void;
  onCancel: (order: SalesOrder) => void;
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
  onCancel,
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
    <div className="relative w-full overflow-visible rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/80 bg-surface-container-low px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Orders Ledger
          </span>
          <span className="text-outline-variant">/</span>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            Live Dispatch Queue
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            Sorted by Time (Desc)
          </span>
          <button
            type="button"
            title="Back to first page"
            aria-label="Back to first page"
            onClick={() => {
              setPage(1);
              setOpenMenuId(null);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant transition duration-200 hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[17px]">refresh</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-10 border-b border-outline-variant/80 bg-surface-container-low font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              <th className="w-12 px-4 text-center">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Select all orders"
                  className="h-4 w-4 cursor-pointer rounded border-outline text-primary focus:ring-0"
                />
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">ORDER #</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">TIME</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">CUSTOMER &amp; LOCATION</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">ITEMS</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">AMOUNT (RS.)</th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-medium">PAYMENT</th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-medium">STATUS</th>
              <th className="w-20 px-4 py-3 text-center font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/70 bg-surface-container-lowest font-body-default text-body-default">
            {visibleOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[28px] text-outline">
                      filter_alt_off
                    </span>
                    <div className="font-body-medium text-body-medium text-on-surface">
                      No orders found
                    </div>
                    <div className="mt-0.5 font-body-dense text-body-dense text-on-surface-variant">
                      Try a different search, status, payment, hub, or date.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              visibleOrders.map((order) => {
                const cancelled = order.status === "Cancelled";
                return (
                  <tr
                    key={order.id}
                    onClick={() => onOpenCustomer(order)}
                    title={`Open customer profile for ${order.customer}`}
                    className={`cursor-pointer transition duration-200 hover:bg-surface-container/60 ${
                      cancelled ? "bg-surface-container-low/40 opacity-75" : ""
                    }`}
                  >
                    <td
                      onClick={(event) => event.stopPropagation()}
                      className="px-4 py-4 text-center"
                    >
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(order.id)}
                        onChange={() => toggleChecked(order.id)}
                        aria-label={`Select ${order.id}`}
                        className="h-4 w-4 cursor-pointer rounded border-outline text-primary focus:ring-0"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`font-mono-data text-mono-data font-medium text-primary ${
                          cancelled ? "line-through decoration-secondary/50" : ""
                        }`}
                      >
                        #{order.id}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      {order.time}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenCustomer(order);
                          }}
                          title={`Open profile for ${order.customer}`}
                          className={`text-left font-body-medium text-body-medium transition duration-200 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                            cancelled ? "text-secondary line-through" : "text-on-surface"
                          }`}
                        >
                          {order.customer}
                        </button>
                        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                          {order.location}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-mono-data-sm text-mono-data-sm tabular-nums text-on-surface">
                      {order.skuCount} {itemLabel(order)}{" "}
                      <span className="text-on-surface-variant">({order.unitCount}u)</span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-4 text-right font-mono-data text-mono-data font-medium tabular-nums ${
                        cancelled ? "text-secondary line-through" : "text-on-surface"
                      }`}
                    >
                      {formatNumber(order.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-1 font-label-caps text-label-caps uppercase ${getPaymentClasses(order.paymentStatus)}`}
                      >
                        {order.paymentLabel}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-1 font-label-caps text-label-caps uppercase ${getStatusClasses(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td
                      onClick={(event) => event.stopPropagation()}
                      className="px-4 py-4 text-center"
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
                        onCancel={(selected) => {
                          setOpenMenuId(null);
                          onCancel(selected);
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/80 bg-surface-container-low px-4 py-3 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>
            Showing{" "}
            <strong className="font-medium text-on-surface">
              {orders.length === 0 ? 0 : start + 1}-{Math.min(start + pageSize, orders.length)}
            </strong>{" "}
            of <strong className="font-medium text-on-surface">{orders.length}</strong> orders
          </span>
          <span className="text-outline-variant">|</span>
          <label className="flex items-center gap-1.5">
            Rows per page:
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
                setOpenMenuId(null);
              }}
              className="h-7 rounded-md border border-outline-variant bg-surface-container-lowest px-1.5 text-on-surface transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container"
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
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition duration-200 hover:border-outline hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => {
                setPage(pageNumber);
                setOpenMenuId(null);
              }}
              className={`h-7 min-w-7 rounded-lg px-1 font-mono-data-sm text-mono-data-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                pageNumber === currentPage
                  ? "border border-primary bg-primary text-on-primary"
                  : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline hover:bg-surface-container hover:text-on-surface"
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
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition duration-200 hover:border-outline hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
