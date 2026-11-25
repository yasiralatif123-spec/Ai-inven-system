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
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-3 shadow-panel">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative min-w-[260px] max-w-lg flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-9 w-full rounded-lg border border-outline-variant/80 bg-surface-container-lowest pl-9 pr-14 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container"
            placeholder="Search supplier, contact or phone..."
            type="text"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-outline-variant bg-surface-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            ⌘K
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <div className="flex h-9 items-center rounded-lg border border-outline-variant bg-surface-container p-1">
            {PAYABLE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => onPayableChange(tab.value)}
                className={`flex h-full items-center gap-1.5 rounded-md px-3 font-body-medium text-body-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                  payable === tab.value
                    ? "border border-outline-variant bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.label}
                {tab.value === "outstanding" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-error" />
                ) : null}
              </button>
            ))}
          </div>

          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container">
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
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

          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container">
            <select
              value={region}
              onChange={(event) => onRegionChange(event.target.value as RegionFilter)}
              className="cursor-pointer appearance-none bg-transparent font-body-medium text-body-medium focus:outline-none"
            >
              {REGION_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              expand_more
            </span>
          </label>

          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container">
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">sort</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortOption)}
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

          <button
            type="button"
            title="Customize Columns"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition duration-200 hover:border-outline hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/80 pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="rounded-md border border-primary-container/40 bg-primary-container/15 px-2.5 py-1 font-mono-data-sm text-mono-data-sm font-semibold text-primary">
            {selectedCount} SELECTED
          </span>
          <span className="font-body-dense text-body-dense text-on-surface-variant">
            Batch operations available for selected distributor:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onRecordPayment}
              disabled={selectedCount === 0}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-body-dense text-body-dense text-on-surface transition duration-200 enabled:hover:border-outline enabled:hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">payments</span>
              Record Payment
            </button>
            <button
              type="button"
              onClick={onSendStatement}
              disabled={selectedCount === 0}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-body-dense text-body-dense text-on-surface transition duration-200 enabled:hover:border-outline enabled:hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            >
              <span className="material-symbols-outlined text-[15px] text-on-surface-variant">mail</span>
              Send Statement
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              disabled={selectedCount === 0}
              className="flex h-8 items-center rounded-lg px-2.5 font-body-dense text-body-dense text-on-surface-variant transition duration-200 enabled:hover:bg-surface-container enabled:hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            >
              Clear Selection
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            AUTO-REFRESH: 60s
          </span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition duration-200 hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
          </button>
        </div>
      </div>
    </div>
  );
}
