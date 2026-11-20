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
      <div className="flex flex-col gap-5">
        <div className="h-[54px] animate-pulse rounded border border-outline-variant bg-surface-container-lowest" />
        <div className="h-[110px] animate-pulse rounded border border-outline-variant bg-surface-container-lowest" />
        <div className="h-[300px] animate-pulse rounded border border-outline-variant bg-surface-container-lowest" />
        <div className="h-[360px] animate-pulse rounded border border-outline-variant bg-surface-container-lowest" />
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded border border-outline-variant bg-surface-container-lowest p-6 text-center">
        <span className="material-symbols-outlined text-[28px] text-error">error_outline</span>
        <div className="font-body-medium text-body-medium text-on-surface">
          {error || "Dashboard data is unavailable."}
        </div>
        <p className="font-body-dense text-body-dense text-secondary">
          Products, stock movements, sale orders, and suppliers are loaded from the backend.
        </p>
        <button
          type="button"
          onClick={reload}
          className="h-[34px] rounded bg-primary-container px-4 font-body-medium text-body-medium text-on-primary transition-colors hover:bg-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5 text-on-surface">
      <DashboardQuickActions sources={snapshot.sources} />
      <DashboardKpis kpis={snapshot.kpis} />
      <SalesOverview charts={snapshot.charts} summaries={snapshot.chartSummaries} />

      <section className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <RecentOrders orders={snapshot.recentOrders} totals={snapshot.orderTotals} />
        <CriticalLowStock rows={snapshot.lowStock} />
      </section>

      <OperationalActivity items={snapshot.activity} />
      <DataSourceStrip sources={snapshot.sources} />
    </div>
  );
}
