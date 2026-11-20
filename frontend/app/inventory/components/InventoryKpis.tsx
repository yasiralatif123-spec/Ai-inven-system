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
    <div className="grid w-full grid-cols-1 divide-y divide-outline-variant rounded border border-outline-variant bg-surface-container-lowest sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
      <div className="flex flex-col justify-between p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            Total On-Hand Stock
          </span>
          <span className="material-symbols-outlined text-[18px] text-secondary">inventory_2</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="font-metric-display text-metric-display text-on-surface">
            {formatNumber(totalUnits)}{" "}
            <span className="font-body-default text-body-default text-secondary">Units</span>
          </div>
          <div className="rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm font-semibold text-on-surface-variant">
            {formatNumber(skuCount)} SKUs
          </div>
        </div>
        <div className="mt-1 truncate font-mono-data-sm text-mono-data-sm text-secondary">
          Across {formatNumber(skuCount)} tracked product{skuCount === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex flex-col justify-between p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            Reserved (Pending Dispatch)
          </span>
          <span className="material-symbols-outlined text-[18px] text-secondary">lock_clock</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="font-metric-display text-metric-display text-on-surface">
            {formatNumber(reservedUnits)}{" "}
            <span className="font-body-default text-body-default text-secondary">Units</span>
          </div>
          <span className="rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-label-caps text-label-caps font-semibold text-on-surface-variant">
            {reservedUnits > 0 ? "Allocated" : "None"}
          </span>
        </div>
        <div className="mt-1 truncate font-mono-data-sm text-mono-data-sm text-secondary">
          {reservedUnits > 0
            ? "Units locked for pending dispatch"
            : "No pending dispatch reservations recorded"}
        </div>
      </div>

      <div className="flex flex-col justify-between p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            Stock Value (Landed Cost)
          </span>
          <span className="material-symbols-outlined text-[18px] text-secondary">
            account_balance_wallet
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="font-metric-display text-metric-display text-on-surface">
            {formatCompactRs(stockValue)}
          </div>
          <span className="font-mono-data-sm text-mono-data-sm font-medium text-primary">PKR</span>
        </div>
        <div className="mt-1 truncate font-mono-data-sm text-mono-data-sm text-secondary">
          Purchase price × on-hand stock
        </div>
      </div>

      <div className="flex flex-col justify-between bg-error-container/20 p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-error">
            Low / Critical Stock
          </span>
          <span className="material-symbols-outlined text-[18px] text-error">warning</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="font-metric-display text-metric-display text-error">
            {formatNumber(alertCount)}{" "}
            <span className="font-body-default text-body-default text-error">
              SKU{alertCount === 1 ? "" : "s"}
            </span>
          </div>
          <span className="rounded border border-[#F7D1CD] bg-[#FDF0EE] px-1.5 py-0.5 font-label-caps text-label-caps font-semibold text-[#BA3C34]">
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
