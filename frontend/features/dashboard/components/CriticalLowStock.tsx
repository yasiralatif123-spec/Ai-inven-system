import Link from "next/link";
import { formatNumber } from "../../../app/inventory/utils";
import type { LowStockRow } from "../types";

export function CriticalLowStock({ rows }: { rows: LowStockRow[] }) {
  return (
    <div className="flex flex-col rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel lg:col-span-5">
      <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-error"></span>
          <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">Critical Low Stock</span>
        </div>
        <span className="rounded-lg border border-error-container bg-error-container/40 px-2.5 py-1 font-mono-data-sm text-mono-data-sm font-medium text-error">
          {formatNumber(rows.length)} items flagged
        </span>
      </div>

      <div className="divide-y divide-outline-variant font-body-default text-body-default">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
            <span className="material-symbols-outlined text-[26px] text-primary">check_circle</span>
            <p className="font-body-medium text-body-medium font-semibold text-on-surface">
              Stock levels are healthy
            </p>
            <p className="font-body-dense text-body-dense text-on-surface-variant">
              No product is below its reorder threshold.
            </p>
          </div>
        ) : (
          rows.map((row) => {
            const params = new URLSearchParams({ product: row.productId });
            const purchaseParams = new URLSearchParams({
              product: row.productId,
              stock: String(row.available),
              lowStock: "1",
            });

            return (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-container-low"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 truncate font-body-medium text-body-medium text-on-surface">
                      {row.title}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                    <span className="font-medium text-error">
                      {formatNumber(row.available)} {row.unit} left
                    </span>
                    <span>-</span>
                    <span>Min: {formatNumber(row.threshold)}</span>
                    <span>-</span>
                    <span>{row.status === "critical" ? "Urgent" : "Reorder"}</span>
                    <span className="text-outline-variant">{row.sku}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href={`/purchases/create?${purchaseParams.toString()}`}
                    aria-label={`Create a purchase for ${row.title}`}
                    className="h-8 rounded-lg bg-primary-container px-2.5 font-mono-data-sm text-mono-data-sm font-medium text-on-primary transition duration-200 hover:bg-primary active:translate-y-px active:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
                  >
                    Purchase
                  </Link>
                  <Link
                    href={`/inventory?${params.toString()}`}
                    className="h-8 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-mono-data-sm text-mono-data-sm font-medium text-primary-container transition duration-200 hover:bg-surface-container hover:underline active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
                  >
                    Adjust Stock
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant bg-surface-container-low px-5 py-3">
        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          Thresholds are read from each product record.
        </span>
        <Link
          href="/inventory?tab=alerts"
          className="rounded-md px-1.5 py-1 font-mono-data-sm text-mono-data-sm font-medium text-primary transition duration-200 hover:bg-surface-container hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          Review inventory -&gt;
        </Link>
      </div>
    </div>
  );
}
