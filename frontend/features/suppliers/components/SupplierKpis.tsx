import type { SupplierSummary } from "../types";
import { formatRs } from "../utils";

type SupplierKpisProps = {
  summary: SupplierSummary;
};

export function SupplierKpis({ summary }: SupplierKpisProps) {
  const activeRate = Math.round((summary.active / summary.total) * 1000) / 10;

  return (
    <div className="mb-4 grid grid-cols-1 rounded bg-surface-container-lowest shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col justify-between border-surface-container px-4 py-3 sm:border-r">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            Total Suppliers
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-outline">COUNT</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tabular-nums text-on-surface">
            {summary.total}
          </span>
          <span className="flex items-center font-mono-data-sm text-mono-data-sm text-primary">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
            +{summary.newThisMonth} this mo
          </span>
        </div>
        <div className="mt-0.5 truncate font-body-dense text-body-dense text-secondary">
          Registered distributors across Punjab &amp; Sindh
        </div>
      </div>

      <div className="flex flex-col justify-between px-4 py-3 lg:border-r lg:border-surface-container">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            Active
          </span>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-primary">
            {activeRate}%
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tabular-nums text-on-surface">
            {summary.active}
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">
            / {summary.total} total
          </span>
        </div>
        <div className="mt-0.5 truncate font-body-dense text-body-dense text-secondary">
          Active commercial credit lines &amp; contracts
        </div>
      </div>

      <div className="flex flex-col justify-between border-surface-container px-4 py-3 sm:border-r">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            Total Payable
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-outline">PKR NET</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tabular-nums text-on-surface">
            {formatRs(summary.totalPayable)}
          </span>
        </div>
        <div className="mt-0.5 truncate font-body-dense text-body-dense text-secondary">
          Across 19 credit accounts
        </div>
      </div>

      <div className="flex flex-col justify-between bg-error-container/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-error">
            Overdue Payments
          </span>
          <span className="rounded bg-error px-1.5 py-0.5 font-label-caps text-[10px] font-semibold uppercase tracking-wider text-on-error">
            Critical
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-metric-display text-metric-display tabular-nums text-error">
            {summary.overdue}
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-error">
            {formatRs(summary.overdueAmount)} total aging
          </span>
        </div>
        <div className="mt-0.5 truncate font-body-dense text-body-dense text-error">
          Requires immediate reconciliation or settlement
        </div>
      </div>
    </div>
  );
}
