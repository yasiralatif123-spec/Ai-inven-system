import Link from "next/link";
import { formatNumber } from "../../../app/inventory/utils";
import type { DashboardSources } from "../types";

export function DataSourceStrip({ sources }: { sources: DashboardSources }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded border border-outline-variant bg-surface-container-lowest px-4 py-2.5 font-mono-data-sm text-mono-data-sm">
      <div className="flex shrink-0 items-center gap-2 font-medium text-on-surface">
        <span className="material-symbols-outlined text-[16px] text-primary-container">bolt</span>
        <span>Live Data Sources</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-secondary">
        <Link href="/products" className="flex items-center gap-1.5 hover:text-on-surface">
          <span className="inline-block h-2 w-2 rounded-full bg-primary-container"></span>
          <span>
            Products: <span className="font-medium text-on-surface">{formatNumber(sources.products)}</span>
          </span>
        </Link>
        <Link href="/inventory" className="flex items-center gap-1.5 hover:text-on-surface">
          <span className="inline-block h-2 w-2 rounded-full bg-primary-container"></span>
          <span>
            Stock movements:{" "}
            <span className="font-medium text-on-surface">{formatNumber(sources.movements)}</span>
          </span>
        </Link>
        <Link href="/sales-orders" className="flex items-center gap-1.5 hover:text-on-surface">
          <span className="inline-block h-2 w-2 rounded-full bg-[#2E7D58]"></span>
          <span>
            Sale orders: <span className="font-medium text-on-surface">{formatNumber(sources.orders)}</span>
          </span>
        </Link>
        <Link href="/suppliers" className="flex items-center gap-1.5 hover:text-on-surface">
          <span className="inline-block h-2 w-2 rounded-full bg-secondary"></span>
          <span>
            Suppliers: <span className="font-medium text-on-surface">{formatNumber(sources.suppliers)}</span>
          </span>
        </Link>
      </div>

      <div className="shrink-0 font-medium text-secondary">
        Synced today at {sources.generatedAt}
      </div>
    </section>
  );
}
