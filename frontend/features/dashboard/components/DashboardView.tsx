"use client";

import { useDashboard } from "../hooks/useDashboard";
import { CriticalLowStock } from "./CriticalLowStock";
import { DashboardKpis } from "./DashboardKpis";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { DataSourceStrip } from "./DataSourceStrip";
import { OperationalActivity } from "./OperationalActivity";
import { RecentOrders } from "./RecentOrders";
import { SalesOverview } from "./SalesOverview";

export function DashboardView() {
  const { snapshot, loading, error, reload } = useDashboard();

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-[56px] animate-pulse rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel" />
        <div className="h-[120px] animate-pulse rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel" />
        <div className="h-[320px] animate-pulse rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel" />
        <div className="h-[380px] animate-pulse rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel" />
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-8 text-center shadow-panel">
        <span className="material-symbols-outlined text-[32px] text-error">error_outline</span>
        <div className="font-body-medium text-body-medium text-on-surface">
          {error || "Dashboard data is unavailable."}
        </div>
        <p className="max-w-sm font-body-dense text-body-dense text-on-surface-variant">
          Products, stock movements, sale orders, and suppliers are loaded from the backend.
        </p>
        <button
          type="button"
          onClick={reload}
          className="h-9 rounded-lg bg-primary-container px-5 font-body-medium text-body-medium text-on-primary transition duration-200 hover:bg-primary active:translate-y-px active:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 text-on-surface">
      <DashboardQuickActions sources={snapshot.sources} />
      <DashboardKpis kpis={snapshot.kpis} />
      <SalesOverview charts={snapshot.charts} summaries={snapshot.chartSummaries} />

      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <RecentOrders orders={snapshot.recentOrders} totals={snapshot.orderTotals} />
        <CriticalLowStock rows={snapshot.lowStock} />
      </section>

      <OperationalActivity items={snapshot.activity} />
      <DataSourceStrip sources={snapshot.sources} />
    </div>
  );
}
