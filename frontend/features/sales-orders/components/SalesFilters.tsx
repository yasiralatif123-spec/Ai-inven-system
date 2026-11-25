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
  "Cancelled",
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
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-3 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px] max-w-lg flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by Order #, Customer, or Phone..."
            className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-9 pr-14 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-outline-variant bg-surface-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            ⌘K
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container">
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
              calendar_today
            </span>
            <select
              value={dateFilter}
              onChange={(event) => onDateFilterChange(event.target.value as DateFilter)}
              className="cursor-pointer appearance-none bg-transparent font-body-medium text-body-medium focus:outline-none"
            >
              {DATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              expand_more
            </span>
          </label>

          <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              Payment:
            </span>
            <select
              value={paymentFilter}
              onChange={(event) => onPaymentFilterChange(event.target.value as PaymentFilter)}
              className="cursor-pointer appearance-none bg-transparent font-body-medium text-body-medium focus:outline-none"
            >
              {PAYMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              expand_more
            </span>
          </label>

          <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container">
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
              warehouse
            </span>
            <select
              value={hubFilter}
              onChange={(event) => onHubFilterChange(event.target.value)}
              className="cursor-pointer appearance-none bg-transparent font-body-medium text-body-medium focus:outline-none"
            >
              {HUB_OPTIONS.map((option) => (
                <option key={option} value={option === "All Dispatch Hubs" ? "all" : option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              expand_more
            </span>
          </label>

          <button
            type="button"
            title="More Filters"
            aria-label="More Filters"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition duration-200 hover:border-outline hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>
      </div>

      {moreOpen ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-outline-variant/70 bg-surface-container-low px-3 py-2.5">
          <label className="flex items-center gap-2 font-body-medium text-body-medium text-on-surface">
            <input
              type="checkbox"
              checked={statusFilter === "Credit Hold"}
              onChange={(event) => onStatusFilterChange(event.target.checked ? "Credit Hold" : "All Orders")}
              className="h-4 w-4 cursor-pointer rounded border-outline text-primary focus:ring-0"
            />
            Credit hold only
          </label>
          <label className="flex items-center gap-2 font-body-medium text-body-medium text-on-surface">
            <input
              type="checkbox"
              checked={paymentFilter === "unpaid"}
              onChange={(event) => onPaymentFilterChange(event.target.checked ? "unpaid" : "all")}
              className="h-4 w-4 cursor-pointer rounded border-outline text-primary focus:ring-0"
            />
            Unpaid only
          </label>
          <button
            type="button"
            onClick={() => {
              onStatusFilterChange("All Orders");
              onPaymentFilterChange("all");
            }}
            className="font-body-medium text-body-medium text-primary underline underline-offset-2 transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            Clear advanced filters
          </button>
        </div>
      ) : null}

      <div
        role="tablist"
        aria-label="Order status"
        className="flex items-center gap-1.5 overflow-x-auto border-t border-outline-variant/70 pt-3"
      >
        {STATUS_TABS.map((status) => {
          const isActive = statusFilter === status;
          const isCreditHold = status === "Credit Hold";
          const className = isCreditHold
            ? "border border-error/20 bg-error-container/40 font-body-medium text-body-medium text-error"
            : isActive
              ? "border border-outline-variant bg-surface-container-highest font-body-medium text-body-medium text-primary shadow-sm"
              : "border border-outline-variant/70 bg-surface-container-lowest font-body-default text-body-medium text-on-surface-variant transition duration-200 hover:border-outline hover:bg-surface-container hover:text-on-surface";

          return (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onStatusFilterChange(status)}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${className}`}
            >
              <span>{status}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 font-mono-data-sm text-[10px] ${
                  isCreditHold
                    ? "bg-error-container text-on-error-container"
                    : isActive
                      ? "bg-surface-container-lowest text-on-surface"
                      : "bg-surface-container text-on-surface-variant"
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
