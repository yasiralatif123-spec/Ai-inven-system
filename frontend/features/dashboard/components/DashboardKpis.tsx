import { formatCompactRs, formatNumber, formatRs } from "../../../app/inventory/utils";
import type { DashboardKpis } from "../types";

function Trend({ changePct }: { changePct: number }) {
  const positive = changePct >= 0;
  return (
    <span className={`flex items-center gap-1.5 font-medium ${positive ? "text-primary" : "text-error"}`}>
      <span className="material-symbols-outlined text-[15px] leading-none">
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
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="flex min-h-[136px] flex-col justify-between rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-panel transition duration-200 hover:border-border">
        <div className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          Total Products
        </div>
        <div className="mt-2 font-metric-display text-metric-display font-semibold tracking-tight text-on-surface">
          {formatNumber(kpis.totalProducts)}
        </div>
        <div className="mt-2 flex items-center gap-1.5 font-mono-data text-mono-data text-on-surface-variant">
          <span className="font-medium text-primary-container">+{kpis.addedThisWeek}</span> added this week ·{" "}
          {formatNumber(kpis.activeProducts)} active
        </div>
      </div>

      <div className="flex min-h-[136px] flex-col justify-between rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-panel transition duration-200 hover:border-border">
        <div className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          Today&apos;s Sales
        </div>
        <div className="mt-2 font-metric-display text-metric-display font-semibold tracking-tight text-on-surface">
          {formatRs(kpis.todaySales)}
        </div>
        <div className="mt-2 font-mono-data text-mono-data">
          <Trend changePct={kpis.salesChangePct} />
        </div>
      </div>

      <div className="flex min-h-[136px] flex-col justify-between rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-panel transition duration-200 hover:border-border">
        <div className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          Stock Value
        </div>
        <div className="mt-2 font-metric-display text-metric-display font-semibold tracking-tight text-on-surface">
          {formatCompactRs(kpis.stockValue)}
        </div>
        <div className="mt-2 font-body-dense text-body-dense italic leading-tight text-on-surface-variant">
          Estimated inventory cost, not revenue.
        </div>
      </div>

      <div className="flex min-h-[136px] flex-col justify-between rounded-xl border border-error-container bg-error-container/20 p-5 shadow-panel transition duration-200 hover:border-error">
        <div className="flex items-center justify-between font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          <span>Low Stock Items</span>
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-error"></span>
        </div>
        <div className="mt-2 font-metric-display text-metric-display font-semibold tracking-tight text-error">
          {formatNumber(kpis.lowStockCount)}
        </div>
        <div className="mt-2 font-mono-data text-mono-data font-medium text-error">
          {formatNumber(kpis.urgentCount)} urgent replenishment needed
        </div>
      </div>
    </section>
  );
}
