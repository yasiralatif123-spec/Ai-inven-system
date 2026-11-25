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
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-3 shadow-panel xl:flex-row xl:items-center xl:justify-between">
      <div className="relative min-w-[260px] max-w-lg flex-1">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
          search
        </span>
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by name, business or phone…"
          className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-9 pr-14 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-outline-variant bg-surface-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          ⌘K
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
        <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface transition duration-200 hover:border-border hover:bg-row-hover focus-within:border-primary focus-within:ring-2 focus-within:ring-primary">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Route:
          </span>
          <select
            value={route}
            onChange={(event) => onRouteChange(event.target.value)}
            className="cursor-pointer appearance-none bg-transparent font-body-medium text-body-medium focus:outline-none"
          >
            {ROUTE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            expand_more
          </span>
        </label>

        <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface transition duration-200 hover:border-border hover:bg-row-hover focus-within:border-primary focus-within:ring-2 focus-within:ring-primary">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Type:
          </span>
          <select
            value={type}
            onChange={(event) => onTypeChange(event.target.value)}
            className="cursor-pointer appearance-none bg-transparent font-body-medium text-body-medium focus:outline-none"
          >
            {TYPE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            expand_more
          </span>
        </label>

        <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface transition duration-200 hover:border-border hover:bg-row-hover focus-within:border-primary focus-within:ring-2 focus-within:ring-primary">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Status:
          </span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="cursor-pointer appearance-none bg-transparent font-body-medium text-body-medium focus:outline-none"
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            expand_more
          </span>
        </label>

        <div className="flex h-9 items-center rounded-lg border border-outline-variant bg-surface-container p-1">
          {BALANCE_TABS.map((tab) => {
            const active = balance === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onBalanceChange(tab.value)}
                className={`h-full rounded-md px-3 font-body-medium text-body-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active
                    ? "border border-outline-variant bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface transition duration-200 hover:border-border hover:bg-row-hover focus-within:border-primary focus-within:ring-2 focus-within:ring-primary">
          <span className="material-symbols-outlined text-[17px] text-on-surface-variant">sort</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as CustomerSort)}
            className="cursor-pointer appearance-none bg-transparent font-body-medium text-body-medium focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            expand_more
          </span>
        </label>
      </div>
    </div>
  );
}
