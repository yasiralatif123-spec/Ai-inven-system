import type { RefObject } from "react";
import {
  REGION_FILTER_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "../constants";
import type {
  PayableFilter,
  RegionFilter,
  SortOption,
  StatusFilter,
} from "../types";

type SupplierFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  payable: PayableFilter;
  onPayableChange: (value: PayableFilter) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  region: RegionFilter;
  onRegionChange: (value: RegionFilter) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  selectedCount: number;
  onClearSelection: () => void;
  onRecordPayment: () => void;
  onSendStatement: () => void;
};

const PAYABLE_TABS: Array<{ value: PayableFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "outstanding", label: "Outstanding" },
  { value: "clear", label: "Clear (0)" },
];

export function SupplierFilters({
  query,
  onQueryChange,
  searchRef,
  payable,
  onPayableChange,
  status,
  onStatusChange,
  region,
  onRegionChange,
  sort,
  onSortChange,
  selectedCount,
  onClearSelection,
  onRecordPayment,
  onSendStatement,
}: SupplierFiltersProps) {
  return (
    <div className="mb-3 flex flex-col gap-2 rounded bg-surface-container-lowest p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px] max-w-md flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline">
            search
          </span>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-[34px] w-full rounded bg-surface pl-8 pr-12 font-body-default text-body-default text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none"
            placeholder="Search supplier, contact or phone..."
            type="text"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-surface-container px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-outline">
            ⌘K
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded bg-surface-container p-0.5">
            {PAYABLE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => onPayableChange(tab.value)}
                className={`flex items-center gap-1 rounded px-2.5 py-1 font-body-medium text-body-dense transition-colors ${
                  payable === tab.value
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.label}
                {tab.value === "outstanding" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-error"></span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="relative">
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
              className="h-[34px] cursor-pointer appearance-none rounded bg-surface pl-2.5 pr-7 font-body-default text-body-default text-on-surface focus:outline-none"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-outline">
              expand_more
            </span>
          </div>

          <div className="relative">
            <select
              value={region}
              onChange={(event) => onRegionChange(event.target.value as RegionFilter)}
              className="h-[34px] cursor-pointer appearance-none rounded bg-surface pl-2.5 pr-7 font-body-default text-body-default text-on-surface focus:outline-none"
            >
              {REGION_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-outline">
              expand_more
            </span>
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortOption)}
              className="h-[34px] cursor-pointer appearance-none rounded bg-surface pl-2.5 pr-7 font-body-default text-body-default text-on-surface focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-outline">
              swap_vert
            </span>
          </div>

          <button
            type="button"
            title="Customize Columns"
            className="flex h-[34px] w-[34px] items-center justify-center rounded bg-surface text-secondary transition-colors hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-primary-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-on-primary">
            {selectedCount} SELECTED
          </span>
          <span className="font-body-dense text-body-dense text-on-surface-variant">
            Batch operations available for selected distributor:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRecordPayment}
              disabled={selectedCount === 0}
              className="flex items-center gap-1 rounded bg-surface px-2 py-0.5 font-body-dense text-body-dense text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[14px] text-primary">payments</span>
              Record Payment
            </button>
            <button
              type="button"
              onClick={onSendStatement}
              disabled={selectedCount === 0}
              className="flex items-center gap-1 rounded bg-surface px-2 py-0.5 font-body-dense text-body-dense text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[14px] text-secondary">mail</span>
              Send Statement
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              disabled={selectedCount === 0}
              className="rounded px-2 py-0.5 font-body-dense text-body-dense text-secondary transition-colors hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear Selection
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono-data-sm text-mono-data-sm text-outline">AUTO-REFRESH: 60s</span>
          <button type="button" className="flex items-center text-secondary hover:text-on-surface">
            <span className="material-symbols-outlined text-[16px]">sync</span>
          </button>
        </div>
      </div>
    </div>
  );
}
