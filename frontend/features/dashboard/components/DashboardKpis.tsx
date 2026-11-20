import { formatCompactRs, formatNumber, formatRs } from "../../../app/inventory/utils";
import type { DashboardKpis } from "../types";

function Trend({ changePct }: { changePct: number }) {
  const positive = changePct >= 0;
  return (
    <span className={`flex items-center gap-1 font-medium ${positive ? "text-[#2E7D58]" : "text-[#BA3C34]"}`}>
      <span className="material-symbols-outlined text-[14px]">
        {positive ? "trending_up" : "trending_down"}
      </span>
      <span>
        {positive ? "+" : ""}
        {changePct.toFixed(1)}% vs yesterday
      </span>
    </span>
  );
}

export function DashboardKpis({ kpis }: { kpis: DashboardKpis }) {
  return (
    <section className="grid grid-cols-1 divide-y divide-outline-variant rounded border border-outline-variant bg-surface-container-lowest p-0 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
      <div className="flex flex-col justify-between p-4">
        <div className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
          Total Products
        </div>
        <div className="mt-1.5 font-metric-display text-metric-display font-semibold tracking-tight text-on-surface">
          {formatNumber(kpis.totalProducts)}
        </div>
        <div className="mt-1 flex items-center gap-1 font-mono-data text-mono-data text-secondary">
          <span className="font-medium text-primary-container">+{kpis.addedThisWeek}</span> added this week ·{" "}
          {formatNumber(kpis.activeProducts)} active
        </div>
      </div>

      <div className="flex flex-col justify-between p-4">
        <div className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
          Today&apos;s Sales
        </div>
        <div className="mt-1.5 font-metric-display text-metric-display font-semibold tracking-tight text-on-surface">
          {formatRs(kpis.todaySales)}
        </div>
        <div className="mt-1 font-mono-data text-mono-data">
          <Trend changePct={kpis.salesChangePct} />
        </div>
      </div>

      <div className="flex flex-col justify-between p-4">
        <div className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
          Stock Value
        </div>
        <div className="mt-1.5 font-metric-display text-metric-display font-semibold tracking-tight text-on-surface">
          {formatCompactRs(kpis.stockValue)}
        </div>
        <div className="mt-1 font-body-dense text-body-dense italic leading-tight text-secondary">
          Estimated inventory cost, not revenue.
        </div>
      </div>

      <div className="flex flex-col justify-between bg-error-container/20 p-4">
        <div className="flex items-center justify-between font-label-caps text-label-caps uppercase tracking-wider text-secondary">
          <span>Low Stock Items</span>
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#BA3C34]"></span>
        </div>
        <div className="mt-1.5 font-metric-display text-metric-display font-semibold tracking-tight text-[#BA3C34]">
          {formatNumber(kpis.lowStockCount)}
        </div>
        <div className="mt-1 font-mono-data text-mono-data font-medium text-[#BA3C34]">
          {formatNumber(kpis.urgentCount)} urgent replenishment needed
        </div>
      </div>
    </section>
  );
}
