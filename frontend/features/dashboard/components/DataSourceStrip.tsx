import Link from "next/link";
import { formatNumber } from "../../../app/inventory/utils";
import type { DashboardSources } from "../types";

export function DataSourceStrip({ sources }: { sources: DashboardSources }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-5 py-3 font-mono-data-sm text-mono-data-sm shadow-panel">
      <div className="flex shrink-0 items-center gap-2 font-medium text-on-surface">
        <span className="material-symbols-outlined text-[17px] text-primary-container">bolt</span>
        <span>Live Data Sources</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-on-surface-variant">
        <Link
          href="/products"
          className="flex items-center gap-2 rounded-md px-2 py-1 transition duration-200 hover:bg-row-hover hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-primary-container"></span>
          <span>
            Products: <span className="font-medium text-on-surface">{formatNumber(sources.products)}</span>
          </span>
        </Link>
        <Link href="/inventory" className="flex items-center gap-2 rounded-md px-2 py-1 transition duration-200 hover:bg-row-hover hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-primary-container"></span>
          <span>
            Stock movements:{" "}
            <span className="font-medium text-on-surface">{formatNumber(sources.movements)}</span>
          </span>
        </Link>
        <Link href="/sales-orders" className="flex items-center gap-2 rounded-md px-2 py-1 transition duration-200 hover:bg-row-hover hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
          <span>
            Sale orders: <span className="font-medium text-on-surface">{formatNumber(sources.orders)}</span>
          </span>
        </Link>
        <Link href="/suppliers" className="flex items-center gap-2 rounded-md px-2 py-1 transition duration-200 hover:bg-row-hover hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-secondary"></span>
          <span>
            Suppliers: <span className="font-medium text-on-surface">{formatNumber(sources.suppliers)}</span>
          </span>
        </Link>
      </div>

      <div className="shrink-0 font-medium text-on-surface-variant">
        Synced today at {sources.generatedAt}
      </div>
    </section>
  );
}
