import { formatNumber } from "../utils";
import type { CustomerSummary } from "../types";

type CustomerKpisProps = {
  summary: CustomerSummary;
};

export function CustomerKpis({ summary }: CustomerKpisProps) {
  return (
    <div className="grid w-full grid-cols-1 divide-y divide-outline-variant/70 rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel md:grid-cols-4 md:divide-x md:divide-y-0">
      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Total Customers
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-container text-on-surface-variant">
            <span className="material-symbols-outlined text-[17px]">groups</span>
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight tabular-nums text-on-surface">
            {formatNumber(summary.total)}
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            registered
          </span>
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          Across {formatNumber(summary.routes)} distribution route
          {summary.routes === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Active Trading
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-container/10 text-primary">
            <span className="material-symbols-outlined text-[17px]">verified</span>
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight tabular-nums text-on-surface">
            {formatNumber(summary.active)}
          </span>
          <span className="font-mono-data-sm text-mono-data-sm font-medium text-primary">
            {summary.activePct.toFixed(1)}%
          </span>
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          Active within current 30-day cycle
        </div>
      </div>

      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Total Receivable
          </span>
          <span className="rounded-md bg-surface-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            PKR
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Rs.</span>
          <span className="font-metric-display text-metric-display tracking-tight tabular-nums text-on-surface">
            {formatNumber(summary.totalReceivable)}
          </span>
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          Due across {formatNumber(summary.receivableAccounts)} trade account
          {summary.receivableAccounts === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex flex-col justify-between bg-error-container/30 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-error">
            Over Credit Limit
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-error-container/70 text-error">
            <span className="material-symbols-outlined text-[17px]">warning</span>
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight tabular-nums text-error">
            {formatNumber(summary.overLimit)}
          </span>
          <span className="rounded-md border border-error/20 bg-error/10 px-1.5 py-0.5 font-label-caps text-[10px] uppercase text-error">
            Critical
          </span>
        </div>
        <div className="mt-1 font-body-dense text-body-dense font-medium text-error">
          Requires owner order sign-off
        </div>
      </div>
    </div>
  );
}
