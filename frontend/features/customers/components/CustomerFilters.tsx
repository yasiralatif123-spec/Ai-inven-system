import type { RefObject } from "react";
import {
  BALANCE_TABS,
  ROUTE_FILTER_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
} from "../constants";
import type { BalanceFilter, CustomerSort } from "../types";

type CustomerFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  route: string;
  onRouteChange: (value: string) => void;
  type: string;
  onTypeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  balance: BalanceFilter;
  onBalanceChange: (value: BalanceFilter) => void;
  sort: CustomerSort;
  onSortChange: (value: CustomerSort) => void;
};

const SELECT_CLASS =
  "h-[32px] cursor-pointer rounded border border-outline-variant bg-surface px-2 font-body-default text-body-default text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container";

export function CustomerFilters({
  query,
  onQueryChange,
  searchRef,
  route,
  onRouteChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
  balance,
  onBalanceChange,
  sort,
  onSortChange,
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded border border-outline-variant bg-surface-container-lowest p-2.5">
      <div className="relative min-w-[260px] max-w-md flex-1">
        <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-secondary">
          search
        </span>
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by name, business or phone…"
          className="h-[32px] w-full rounded border border-outline-variant bg-surface pl-8 pr-12 font-body-default text-body-default text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-mono-data-sm text-[10px] text-secondary">
          ⌘K
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center rounded border border-outline-variant bg-surface px-2 text-on-surface">
          <span className="mr-1.5 font-label-caps text-[10px] uppercase text-secondary">Route:</span>
          <select
            value={route}
            onChange={(event) => onRouteChange(event.target.value)}
            className="h-[30px] cursor-pointer bg-transparent pr-1 font-body-default text-body-default text-on-surface focus:outline-none"
          >
            {ROUTE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center rounded border border-outline-variant bg-surface px-2 text-on-surface">
          <span className="mr-1.5 font-label-caps text-[10px] uppercase text-secondary">Type:</span>
          <select
            value={type}
            onChange={(event) => onTypeChange(event.target.value)}
            className="h-[30px] cursor-pointer bg-transparent pr-1 font-body-default text-body-default text-on-surface focus:outline-none"
          >
            {TYPE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center rounded border border-outline-variant bg-surface px-2 text-on-surface">
          <span className="mr-1.5 font-label-caps text-[10px] uppercase text-secondary">Status:</span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="h-[30px] cursor-pointer bg-transparent pr-1 font-body-default text-body-default text-on-surface focus:outline-none"
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="inline-flex h-[32px] rounded border border-outline-variant bg-surface p-0.5">
          {BALANCE_TABS.map((tab) => {
            const active = balance === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onBalanceChange(tab.value)}
                className={`rounded px-2.5 text-[12px] font-medium transition-colors ${
                  active
                    ? "bg-surface-container-highest text-on-surface"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center rounded border border-outline-variant bg-surface px-2 text-on-surface">
          <span className="material-symbols-outlined mr-1 text-[16px] text-secondary">sort</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as CustomerSort)}
            className={`${SELECT_CLASS} h-[30px] cursor-pointer border-0 bg-transparent px-0`}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
