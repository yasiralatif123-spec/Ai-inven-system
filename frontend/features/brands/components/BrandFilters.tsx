"use client";

import { useEffect, useRef } from "react";
import { SORT_OPTIONS, STATUS_FILTER_OPTIONS } from "../constants";
import type { BrandSort, BrandStatusFilter } from "../types";

type BrandFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  status: BrandStatusFilter;
  onStatusChange: (value: BrandStatusFilter) => void;
  sort: BrandSort;
  onSortChange: (value: BrandSort) => void;
};

const selectClass =
  "h-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

export function BrandFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
}: BrandFiltersProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-3 shadow-panel sm:flex-row sm:items-center">
      <div className="relative min-w-[240px] flex-1">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
          search
        </span>
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search brands..."
          aria-label="Search brands"
          className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-9 pr-14 font-body-default text-body-default text-on-surface placeholder:text-outline transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-outline-variant bg-surface-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          ⌘K
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="brand-status-filter">
          Filter by status
        </label>
        <select
          id="brand-status-filter"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as BrandStatusFilter)}
          className={selectClass}
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="brand-sort">
          Sort brands
        </label>
        <select
          id="brand-sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as BrandSort)}
          className={selectClass}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
