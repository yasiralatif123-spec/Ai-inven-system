"use client";

import { useMemo, useState } from "react";
import { STOCK_STATUS_META, type StockRow } from "../data";
import { formatFlavorLabel, formatNumber } from "../utils";

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
    <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-secondary">table_view</span>
          <span className="font-headline-md text-headline-md text-on-surface">Wholesale Stock Racks</span>
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">
            {scope === "alerts" ? "(Active Alerts)" : "(Active Depot Ledger)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-label-caps uppercase text-secondary">Sort:</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortKey)}
            className="h-6 cursor-pointer border-0 bg-transparent p-0 font-mono-data text-[11px] text-on-surface focus:ring-0"
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
            <tr className="h-8 border-b border-outline-variant bg-surface-container-high/60 font-label-caps text-label-caps uppercase text-secondary">
              <th className="w-8 py-1.5 pl-3.5 pr-2">
                <input
                  className="cursor-pointer rounded border-outline-variant text-primary focus:ring-0"
                  type="checkbox"
                  aria-label="Select all products"
                />
              </th>
              <th className="px-3 py-1.5">Product &amp; SKU</th>
              <th className="px-3 py-1.5">Flavor</th>
              <th className="px-3 py-1.5">Depot Location</th>
              <th className="px-3 py-1.5 text-right">Available</th>
              <th className="px-3 py-1.5 text-right">Reserved</th>
              <th className="px-3 py-1.5 text-right">Total On-Hand</th>
              <th className="px-3 py-1.5 text-right">Min. Safety</th>
              <th className="px-3 py-1.5 text-center">Status</th>
              <th className="py-1.5 pl-2 pr-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-body-default text-body-default">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-secondary">
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
                    className={`transition-colors hover:bg-surface-container-low ${meta.rowClass}`}
                  >
                    <td className="py-2 pl-3.5 pr-2">
                      <input
                        className="rounded border-outline-variant text-primary focus:ring-0"
                        type="checkbox"
                        aria-label={`Select ${row.name}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-body-medium text-body-medium font-semibold text-on-surface">
                          {row.name}
                        </span>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="rounded border border-outline-variant bg-surface-container px-1 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                            {row.sku}
                          </span>
                          <span className="font-label-caps text-[10px] uppercase text-secondary">
                            {row.brand} • {row.pack}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded border px-1.5 py-0.5 font-body-medium text-[12px] ${
                          row.flavor
                            ? "border-primary/30 bg-primary-container/20 font-semibold text-primary"
                            : "border-outline-variant bg-surface-container text-secondary"
                        }`}
                      >
                        {formatFlavorLabel(row.flavor)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 font-mono-data-sm text-mono-data-sm font-medium text-on-surface">
                        <span className="material-symbols-outlined text-[14px] text-secondary">warehouse</span>
                        {row.location}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-right font-mono-data text-mono-data font-bold ${meta.valueClass}`}>
                      {formatNumber(row.available)} {row.unit}
                    </td>
                    <td className="px-3 py-2 text-right font-mono-data text-mono-data text-secondary">
                      {row.reserved ? `${formatNumber(row.reserved)} ${row.unit}` : "0"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono-data text-mono-data font-semibold text-on-surface">
                      {formatNumber(totalOnHand)} {row.unit}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                          {row.minSafety ? `Min: ${formatNumber(row.minSafety)}` : "Min: Not set"}
                        </span>
                        <div className="mt-1 h-1 w-14 overflow-hidden rounded-full bg-outline-variant">
                          <div className={`h-full ${meta.barClass}`} style={{ width: barWidth }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex rounded border px-1.5 py-0.5 font-label-caps text-label-caps font-semibold uppercase ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-2 pl-2 pr-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onAdjust(row)}
                        className="rounded border border-outline-variant bg-surface-container px-2 py-1 font-body-medium text-[12px] text-primary transition-colors hover:bg-surface-container-highest"
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

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant bg-surface-container-low px-4 py-2 font-mono-data-sm text-mono-data-sm text-secondary">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            {rows.length === 0
              ? "No SKUs match the current filter"
              : scope === "alerts"
                ? `Showing ${rows.length} active alert SKU${rows.length === 1 ? "" : "s"}`
                : `Showing 1 - ${rows.length} of ${rows.length} tracked warehouse SKUs`}
          </span>
          <span>•</span>
          <span className={alertCount > 0 ? "font-medium text-error" : "font-medium text-primary"}>
            {alertCount > 0
              ? `${alertCount} SKU${alertCount === 1 ? "" : "s"} require immediate PO dispatch`
              : "All SKUs are above their safety thresholds"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D58]" />
          Live from MongoDB
        </div>
      </div>
    </div>
  );
}
