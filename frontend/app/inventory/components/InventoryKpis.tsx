import { formatCompactRs, formatNumber } from "../utils";

type InventoryKpisProps = {
  totalUnits: number;
  reservedUnits: number;
  stockValue: number;
  lowCount: number;
  criticalCount: number;
  skuCount: number;
};

export function InventoryKpis({
  totalUnits,
  reservedUnits,
  stockValue,
  lowCount,
  criticalCount,
  skuCount,
}: InventoryKpisProps) {
  const alertCount = lowCount + criticalCount;

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex min-h-[120px] flex-col justify-between rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-panel transition duration-200 hover:border-border">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Total On-Hand Stock
          </span>
          <span className="material-symbols-outlined text-[19px] text-on-surface-variant">inventory_2</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="font-metric-display text-metric-display tabular-nums text-on-surface">
            {formatNumber(totalUnits)}{" "}
            <span className="font-body-default text-body-default text-on-surface-variant">Units</span>
          </div>
          <div className="rounded-lg border border-outline-variant bg-surface-container px-2 py-1 font-mono-data-sm text-mono-data-sm font-semibold text-on-surface-variant">
            {formatNumber(skuCount)} SKUs
          </div>
        </div>
        <div className="mt-1 truncate font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          Across {formatNumber(skuCount)} tracked product{skuCount === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex min-h-[120px] flex-col justify-between rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-panel transition duration-200 hover:border-border">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Reserved (Pending Dispatch)
          </span>
          <span className="material-symbols-outlined text-[19px] text-on-surface-variant">lock_clock</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="font-metric-display text-metric-display tabular-nums text-on-surface">
            {formatNumber(reservedUnits)}{" "}
            <span className="font-body-default text-body-default text-on-surface-variant">Units</span>
          </div>
          <span className="rounded-lg border border-outline-variant bg-surface-container px-2 py-1 font-label-caps text-label-caps font-semibold text-on-surface-variant">
            {reservedUnits > 0 ? "Allocated" : "None"}
          </span>
        </div>
        <div className="mt-1 truncate font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          {reservedUnits > 0
            ? "Units locked for pending dispatch"
            : "No pending dispatch reservations recorded"}
        </div>
      </div>

      <div className="flex min-h-[120px] flex-col justify-between rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-panel transition duration-200 hover:border-border">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Stock Value (Landed Cost)
          </span>
          <span className="material-symbols-outlined text-[19px] text-on-surface-variant">
            account_balance_wallet
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="font-metric-display text-metric-display tabular-nums text-on-surface">
            {formatCompactRs(stockValue)}
          </div>
          <span className="font-mono-data-sm text-mono-data-sm font-medium text-primary">PKR</span>
        </div>
        <div className="mt-1 truncate font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          Purchase price × on-hand stock
        </div>
      </div>

      <div className="flex min-h-[120px] flex-col justify-between rounded-xl border border-error-container bg-error-container/20 p-4 shadow-panel transition duration-200 hover:border-error/30">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-error">
            Low / Critical Stock
          </span>
          <span className="material-symbols-outlined text-[19px] text-error">warning</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="font-metric-display text-metric-display tabular-nums text-error">
            {formatNumber(alertCount)}{" "}
            <span className="font-body-default text-body-default text-error">
              SKU{alertCount === 1 ? "" : "s"}
            </span>
          </div>
          <span className="rounded-lg border border-error/20 bg-error-container/30 px-2 py-1 font-label-caps text-label-caps font-semibold text-error">
            {alertCount > 0 ? "PO Required" : "Healthy"}
          </span>
        </div>
        <div className="mt-1 truncate font-mono-data-sm text-mono-data-sm text-error/80">
          {formatNumber(criticalCount)} critical • {formatNumber(lowCount)} low
        </div>
      </div>
    </div>
  );
}
