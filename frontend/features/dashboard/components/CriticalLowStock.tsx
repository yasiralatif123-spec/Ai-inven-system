import Link from "next/link";
import { formatNumber } from "../../../app/inventory/utils";
import type { LowStockRow } from "../types";

export function CriticalLowStock({ rows }: { rows: LowStockRow[] }) {
  return (
    <div className="flex flex-col rounded border border-outline-variant bg-surface-container-lowest lg:col-span-5">
      <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#BA3C34]"></span>
          <span className="font-headline-md text-headline-md text-on-surface">Critical Low Stock</span>
        </div>
        <span className="rounded border border-error-container bg-error-container/30 px-2 py-0.5 font-mono-data-sm text-mono-data-sm font-medium text-[#BA3C34]">
          {formatNumber(rows.length)} SKUs flagged
        </span>
      </div>

      <div className="divide-y divide-outline-variant font-body-default text-body-default">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center">
            <span className="material-symbols-outlined text-[24px] text-primary">check_circle</span>
            <p className="font-body-medium text-body-medium font-semibold text-on-surface">
              Stock levels are healthy
            </p>
            <p className="font-body-dense text-body-dense text-secondary">
              No products are below their reorder threshold.
            </p>
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-surface-container-low"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-body-medium text-body-medium text-on-surface">
                  {row.title}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono-data-sm text-mono-data-sm text-secondary">
                  <span className="font-medium text-[#BA3C34]">
                    {formatNumber(row.available)} {row.unit} left
                  </span>
                  <span>·</span>
                  <span>Min: {formatNumber(row.threshold)}</span>
                  <span>·</span>
                  <span>{row.status === "critical" ? "Urgent" : "Reorder"}</span>
                  <span className="text-outline-variant">{row.sku}</span>
                </div>
              </div>
              <Link
                href={`/inventory?product=${encodeURIComponent(row.id)}`}
                className="shrink-0 rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 font-mono-data-sm text-mono-data-sm font-medium text-primary-container transition-colors hover:bg-surface-container hover:underline"
              >
                Adjust Stock
              </Link>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-4 py-2">
        <span className="font-mono-data-sm text-mono-data-sm text-secondary">
          Thresholds are read from each product record.
        </span>
        <Link
          href="/inventory?tab=alerts"
          className="font-mono-data-sm text-mono-data-sm font-medium text-primary hover:underline"
        >
          Review inventory →
        </Link>
      </div>
    </div>
  );
}
