import { formatNumber } from "../utils";
import type { CustomerSummary } from "../types";

type CustomerKpisProps = {
  summary: CustomerSummary;
};

export function CustomerKpis({ summary }: CustomerKpisProps) {
  return (
    <div className="grid w-full grid-cols-1 rounded border border-outline-variant bg-surface-container-lowest sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col justify-between border-b border-outline-variant p-3.5 sm:border-r sm:border-b-0">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase text-secondary">
            Total Customers
          </span>
          <span className="material-symbols-outlined text-[16px] text-secondary">groups</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight text-on-surface">
            {formatNumber(summary.total)}
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">registered</span>
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          Across {formatNumber(summary.routes)} distribution route
          {summary.routes === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex flex-col justify-between border-b border-outline-variant p-3.5 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase text-secondary">
            Active Trading
          </span>
          <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight text-on-surface">
            {formatNumber(summary.active)}
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-primary">
            {summary.activePct.toFixed(1)}%
          </span>
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          Active within current 30-day cycle
        </div>
      </div>

      <div className="flex flex-col justify-between border-b border-outline-variant p-3.5 sm:border-r sm:border-b-0">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase text-secondary">
            Total Receivable
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">PKR</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-label-caps text-label-caps text-secondary">Rs.</span>
          <span className="font-metric-display text-metric-display tracking-tight text-on-surface">
            {formatNumber(summary.totalReceivable)}
          </span>
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          Due across {formatNumber(summary.receivableAccounts)} trade account
          {summary.receivableAccounts === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex flex-col justify-between bg-error-container/20 p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase text-error">
            Over Credit Limit
          </span>
          <span className="material-symbols-outlined text-[16px] text-error">warning</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight text-error">
            {formatNumber(summary.overLimit)}
          </span>
          <span className="rounded border border-error/20 bg-error/10 px-1.5 py-0.5 font-label-caps text-[10px] uppercase text-error">
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
