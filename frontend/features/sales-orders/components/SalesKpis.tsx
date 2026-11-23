import { formatRs, type SalesKpisData } from "../utils";

type SalesKpisProps = {
  data: SalesKpisData;
};

export function SalesKpis({ data }: SalesKpisProps) {
  return (
    <div className="grid grid-cols-2 divide-y divide-outline-variant rounded border border-outline-variant bg-surface-container-lowest md:grid-cols-5 md:divide-x md:divide-y-0">
      <div className="flex flex-col justify-between p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase text-secondary">Total Sales (Today)</span>
          <span className="material-symbols-outlined text-[16px] text-secondary">account_balance_wallet</span>
        </div>
        <div className="mt-1">
          <div className="font-metric-display text-metric-display leading-tight tabular-nums text-on-surface">
            {formatRs(data.totalSalesToday)}
          </div>
          <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
            {data.todayOrders} booked today
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase text-secondary">Today&apos;s Orders</span>
          <span className="material-symbols-outlined text-[16px] text-secondary">shopping_cart</span>
        </div>
        <div className="mt-1">
          <div className="font-metric-display text-metric-display leading-tight tabular-nums text-on-surface">
            {data.todayOrders}
          </div>
          <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
            {data.awaitingPacking} awaiting packing
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase text-secondary">Pending Action</span>
          <span className="material-symbols-outlined text-[16px] text-tertiary">pending_actions</span>
        </div>
        <div className="mt-1">
          <div className="font-metric-display text-metric-display leading-tight tabular-nums text-on-surface">
            {data.pendingAction}
          </div>
          <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-tertiary">
            {formatRs(data.pendingCollection)} pending collection
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase text-secondary">Completed</span>
          <span className="material-symbols-outlined text-[16px] text-primary">task_alt</span>
        </div>
        <div className="mt-1">
          <div className="font-metric-display text-metric-display leading-tight tabular-nums text-on-surface">
            {data.completed}
          </div>
          <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-primary">
            {data.dispatched} dispatched orders
          </div>
        </div>
      </div>

      <div className="col-span-2 flex flex-col justify-between p-3.5 md:col-span-1">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase text-secondary">Cancelled / Hold</span>
          <span className="material-symbols-outlined text-[16px] text-error">assignment_return</span>
        </div>
        <div className="mt-1">
          <div className="font-metric-display text-metric-display leading-tight tabular-nums text-error">
            {data.creditHold + data.cancelled}
          </div>
          <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
            {data.creditHold} hold · {data.cancelled} cancelled
          </div>
        </div>
      </div>
    </div>
  );
}
