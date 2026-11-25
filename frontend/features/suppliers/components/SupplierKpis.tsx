import type { SupplierSummary } from "../types";
import { formatRs } from "../utils";

type SupplierKpisProps = {
  summary: SupplierSummary;
};

export function SupplierKpis({ summary }: SupplierKpisProps) {
  const activeRate = Math.round((summary.active / summary.total) * 1000) / 10;

  return (
    <div className="grid w-full grid-cols-1 divide-y divide-outline-variant/70 rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel md:grid-cols-4 md:divide-x md:divide-y-0">
      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Total Suppliers
          </span>
          <span className="rounded-md bg-surface-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            COUNT
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight tabular-nums text-on-surface">
            {summary.total}
          </span>
          <span className="flex items-center font-mono-data-sm text-mono-data-sm font-medium text-primary">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
            +{summary.newThisMonth} this mo
          </span>
        </div>
        <div className="mt-1 truncate font-body-dense text-body-dense text-on-surface-variant">
          Registered distributors across Punjab &amp; Sindh
        </div>
      </div>

      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Active
          </span>
          <span className="rounded-md bg-primary-container/10 px-2 py-1 font-mono-data-sm text-mono-data-sm font-medium text-primary">
            {activeRate}%
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight tabular-nums text-on-surface">
            {summary.active}
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            / {summary.total} total
          </span>
        </div>
        <div className="mt-1 truncate font-body-dense text-body-dense text-on-surface-variant">
          Active commercial credit lines &amp; contracts
        </div>
      </div>

      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Total Payable
          </span>
          <span className="rounded-md bg-surface-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            PKR NET
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight tabular-nums text-on-surface">
            {formatRs(summary.totalPayable)}
          </span>
        </div>
        <div className="mt-1 truncate font-body-dense text-body-dense text-on-surface-variant">
          Across 19 credit accounts
        </div>
      </div>

      <div className="flex flex-col justify-between bg-error-container/30 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-error">
            Overdue Payments
          </span>
          <span className="rounded-md bg-error/10 px-2 py-1 font-label-caps text-[10px] font-semibold uppercase tracking-wider text-error">
            Critical
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tracking-tight tabular-nums text-error">
            {summary.overdue}
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-error">
            {formatRs(summary.overdueAmount)} total aging
          </span>
        </div>
        <div className="mt-1 truncate font-body-dense text-body-dense font-medium text-error">
          Requires immediate reconciliation or settlement
        </div>
      </div>
    </div>
  );
}
