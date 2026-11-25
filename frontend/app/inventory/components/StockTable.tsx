"use client";

import { useMemo, useState } from "react";
import { STOCK_STATUS_META, type StockRow } from "../data";
import { formatNumber } from "../utils";

type StockTableProps = {
  rows: StockRow[];
  onAdjust: (row: StockRow) => void;
  scope?: "all" | "alerts";
};

type SortKey = "severity" | "available" | "location" | "sku";

const SEVERITY_ORDER: Record<StockRow["status"], number> = {
  critical: 0,
  low: 1,
  "in-stock": 2,
  optimal: 3,
};

const STATUS_BADGE_CLASS: Record<StockRow["status"], string> = {
  critical: "border-error/20 bg-error-container/30 text-error",
  low: "border-outline-variant bg-surface-container text-on-surface-variant",
  "in-stock": "border-primary/20 bg-primary-fixed/20 text-primary",
  optimal: "border-primary/20 bg-primary-fixed/20 text-primary",
};

const STATUS_ROW_CLASS: Record<StockRow["status"], string> = {
  critical: "bg-error-container/10",
  low: "bg-surface-container-low/60",
  "in-stock": "",
  optimal: "",
};

const STATUS_BAR_CLASS: Record<StockRow["status"], string> = {
  critical: "bg-error",
  low: "bg-tertiary",
  "in-stock": "bg-primary",
  optimal: "bg-primary",
};

const STATUS_VALUE_CLASS: Record<StockRow["status"], string> = {
  critical: "text-error",
  low: "text-tertiary",
  "in-stock": "text-on-surface",
  optimal: "text-on-surface",
};

export function StockTable({ rows, onAdjust, scope = "all" }: StockTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("severity");

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    switch (sortBy) {
      case "available":
        return copy.sort((a, b) => b.available - a.available);
      case "location":
        return copy.sort((a, b) => a.location.localeCompare(b.location));
      case "sku":
        return copy.sort((a, b) => a.sku.localeCompare(b.sku));
      default:
        return copy.sort((a, b) => SEVERITY_ORDER[a.status] - SEVERITY_ORDER[b.status]);
    }
  }, [rows, sortBy]);

  const alertCount = rows.filter(
    (row) => row.status === "critical" || row.status === "low"
  ).length;

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[19px] text-on-surface-variant">table_view</span>
          <span className="font-headline-md text-headline-md text-on-surface">Wholesale Stock Racks</span>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            {scope === "alerts" ? "(Active Alerts)" : "(Active Depot Ledger)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortKey)}
            className="h-7 cursor-pointer rounded-md border border-outline-variant bg-surface-container-lowest px-2 font-mono-data-sm text-mono-data-sm text-on-surface transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="severity">Status Severity (Critical First)</option>
            <option value="available">Highest Available Units</option>
            <option value="location">Bay Location (A-Z)</option>
            <option value="sku">SKU Code</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-10 border-b border-outline-variant bg-surface-container-low/80 font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
              <th className="w-8 py-2.5 pl-4 pr-2">
                <input
                  className="h-3.5 w-3.5 cursor-pointer rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
                  type="checkbox"
                  aria-label="Select all products"
                />
              </th>
              <th className="whitespace-nowrap px-3.5 py-2.5">Product &amp; SKU</th>
              <th className="whitespace-nowrap px-3.5 py-2.5">Depot Location</th>
              <th className="whitespace-nowrap px-3.5 py-2.5 text-right">Available</th>
              <th className="whitespace-nowrap px-3.5 py-2.5 text-right">Reserved</th>
              <th className="whitespace-nowrap px-3.5 py-2.5 text-right">Total On-Hand</th>
              <th className="whitespace-nowrap px-3.5 py-2.5 text-right">Min. Safety</th>
              <th className="whitespace-nowrap px-3.5 py-2.5 text-center">Status</th>
              <th className="whitespace-nowrap py-2.5 pl-2 pr-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-body-default text-body-default">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-on-surface-variant">
                  No products match the current filters.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const meta = STOCK_STATUS_META[row.status];
                const totalOnHand = row.available + row.reserved;
                const barWidth = `${Math.min(
                  100,
                  Math.round((totalOnHand / Math.max(1, row.minSafety)) * 100)
                )}%`;

                return (
                  <tr
                    key={row.id}
                    className={`transition duration-200 hover:bg-surface-container-low ${STATUS_ROW_CLASS[row.status]}`}
                  >
                    <td className="py-3 pl-4 pr-2">
                      <input
                        className="h-3.5 w-3.5 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
                        type="checkbox"
                        aria-label={`Select ${row.name}`}
                      />
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-body-medium text-body-dense font-semibold text-on-surface">
                          {row.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md border border-outline-variant bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                            {row.sku}
                          </span>
                          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                            {row.brand} - {row.pack}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="flex items-center gap-1.5 font-mono-data-sm text-mono-data-sm font-medium text-on-surface">
                        <span className="material-symbols-outlined text-[15px] text-on-surface-variant">warehouse</span>
                        {row.location}
                      </span>
                    </td>
                    <td className={`px-3.5 py-3 text-right font-mono-data text-mono-data-sm font-bold tabular-nums ${STATUS_VALUE_CLASS[row.status]}`}>
                      <div className="flex flex-col items-end gap-1.5">
                        <span>{row.stockDisplay}</span>
                        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                          {formatNumber(row.available)} pcs
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono-data text-mono-data tabular-nums text-on-surface-variant">
                      {row.reserved ? `${formatNumber(row.reserved)} pcs` : "0"}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono-data text-mono-data-sm font-semibold tabular-nums text-on-surface">
                      <div className="flex flex-col items-end gap-1.5">
                        <span>{row.stockDisplay}</span>
                        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                          {formatNumber(totalOnHand)} pcs
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                          {row.minSafety ? `Min: ${formatNumber(row.minSafety)} pcs` : "Min: Not set"}
                        </span>
                        <div className="mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-outline-variant/60">
                          <div className={`h-full ${STATUS_BAR_CLASS[row.status]}`} style={{ width: barWidth }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 font-label-caps text-label-caps font-semibold uppercase tracking-wide ${STATUS_BADGE_CLASS[row.status]}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3 pl-2 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => onAdjust(row)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-primary transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low px-4 py-3 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            {rows.length === 0
              ? "No SKUs match the current filter"
              : scope === "alerts"
                ? `Showing ${rows.length} active alert SKU${rows.length === 1 ? "" : "s"}`
                : `Showing 1 - ${rows.length} of ${rows.length} tracked warehouse SKUs`}
          </span>
          <span>-</span>
          <span className={alertCount > 0 ? "font-medium text-error" : "font-medium text-primary"}>
            {alertCount > 0
              ? `${alertCount} SKU${alertCount === 1 ? "" : "s"} require immediate PO dispatch`
              : "All SKUs are above their safety thresholds"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Live from MongoDB
        </div>
      </div>
    </div>
  );
}
