"use client";

import { useState } from "react";
import { DATE_OPTIONS, HUB_OPTIONS, PAYMENT_OPTIONS } from "../constants";
import type { DateFilter, HubFilter, PaymentFilter, StatusFilter, StatusTab } from "../types";

type SalesFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (value: DateFilter) => void;
  paymentFilter: PaymentFilter;
  onPaymentFilterChange: (value: PaymentFilter) => void;
  hubFilter: HubFilter;
  onHubFilterChange: (value: HubFilter) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  statusCounts: Record<StatusTab, number>;
};

const STATUS_TABS: StatusTab[] = [
  "All Orders",
  "Pending Approval",
  "Processing",
  "Dispatched",
  "Credit Hold",
];

export function SalesFilters({
  query,
  onQueryChange,
  dateFilter,
  onDateFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  hubFilter,
  onHubFilterChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
}: SalesFiltersProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2.5 rounded border border-outline-variant bg-surface-container-lowest p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative min-w-[280px] max-w-lg flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[17px] text-outline">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by Order #, Customer, or Phone..."
            className="h-8 w-full rounded border border-outline-variant bg-surface pl-8 pr-12 font-body-default text-body-default text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-outline-variant bg-surface-container-high px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-outline">
            ⌘K
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded border border-outline-variant bg-surface px-2.5 text-on-surface transition-colors hover:bg-surface-container">
            <span className="material-symbols-outlined text-[15px] text-secondary">calendar_today</span>
            <select
              value={dateFilter}
              onChange={(event) => onDateFilterChange(event.target.value as DateFilter)}
              className="cursor-pointer appearance-none bg-transparent font-body-default text-body-dense focus:outline-none"
            >
              {DATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
          </label>

          <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded border border-outline-variant bg-surface px-2.5 text-on-surface transition-colors hover:bg-surface-container">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(event) => onPaymentFilterChange(event.target.value as PaymentFilter)}
              className="cursor-pointer appearance-none bg-transparent font-body-default text-body-dense focus:outline-none"
            >
              {PAYMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
          </label>

          <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded border border-outline-variant bg-surface px-2.5 text-on-surface transition-colors hover:bg-surface-container">
            <span className="material-symbols-outlined text-[15px] text-secondary">warehouse</span>
            <select
              value={hubFilter}
              onChange={(event) => onHubFilterChange(event.target.value)}
              className="cursor-pointer appearance-none bg-transparent font-body-default text-body-dense focus:outline-none"
            >
              {HUB_OPTIONS.map((option) => (
                <option key={option} value={option === "All Dispatch Hubs" ? "all" : option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
          </label>

          <button
            type="button"
            title="More Filters"
            aria-label="More Filters"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((current) => !current)}
            className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant bg-surface text-secondary transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[17px]">tune</span>
          </button>
        </div>
      </div>

      {moreOpen ? (
        <div className="flex flex-wrap items-center gap-4 rounded border border-outline-variant bg-surface-container-low px-3 py-2">
          <label className="flex items-center gap-1.5 font-body-default text-body-dense text-on-surface">
            <input
              type="checkbox"
              checked={statusFilter === "Credit Hold"}
              onChange={(event) => onStatusFilterChange(event.target.checked ? "Credit Hold" : "All Orders")}
              className="h-3.5 w-3.5 cursor-pointer rounded border-outline text-primary focus:ring-0"
            />
            Credit hold only
          </label>
          <label className="flex items-center gap-1.5 font-body-default text-body-dense text-on-surface">
            <input
              type="checkbox"
              checked={paymentFilter === "unpaid"}
              onChange={(event) => onPaymentFilterChange(event.target.checked ? "unpaid" : "all")}
              className="h-3.5 w-3.5 cursor-pointer rounded border-outline text-primary focus:ring-0"
            />
            Unpaid only
          </label>
          <button
            type="button"
            onClick={() => {
              onStatusFilterChange("All Orders");
              onPaymentFilterChange("all");
            }}
            className="font-mono-data-sm text-mono-data-sm text-primary underline"
          >
            Clear advanced filters
          </button>
        </div>
      ) : null}

      <div
        role="tablist"
        aria-label="Order status"
        className="flex items-center gap-1.5 overflow-x-auto border-t border-outline-variant/60 pt-1"
      >
        {STATUS_TABS.map((status) => {
          const isActive = statusFilter === status;
          const isCreditHold = status === "Credit Hold";
          const className = isCreditHold
            ? "border border-error-container bg-error-container/40 font-body-medium text-body-dense text-error"
            : isActive
              ? "border border-outline-variant bg-surface-container-highest font-body-medium text-body-dense text-primary"
              : "border border-outline-variant bg-surface font-body-default text-body-dense text-secondary transition-colors hover:bg-surface-container";

          return (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onStatusFilterChange(status)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1 ${className}`}
            >
              <span>{status}</span>
              <span
                className={`rounded px-1.5 py-0.2 font-mono-data-sm text-[10px] ${
                  isCreditHold
                    ? "bg-error-container text-on-error-container"
                    : isActive
                      ? "bg-surface text-on-surface"
                      : "bg-surface-container-high text-secondary"
                }`}
              >
                {statusCounts[status]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
