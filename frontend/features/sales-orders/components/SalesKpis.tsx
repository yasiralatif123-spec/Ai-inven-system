import { formatRs, type SalesKpisData } from "../utils";

type SalesKpisProps = {
  data: SalesKpisData;
};

export function SalesKpis({ data }: SalesKpisProps) {
  return (
    <div className="grid w-full grid-cols-1 divide-y divide-outline-variant/70 rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel md:grid-cols-5 md:divide-x md:divide-y-0">
      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Total Sales (Today)
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-container/10 text-primary">
            <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
          </span>
        </div>
        <div className="mt-3 font-metric-display text-metric-display tracking-tight tabular-nums text-on-surface">
          {formatRs(data.totalSalesToday)}
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          {data.todayOrders} booked today
        </div>
      </div>

      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Today&apos;s Orders
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-container text-on-surface-variant">
            <span className="material-symbols-outlined text-[17px]">shopping_cart</span>
          </span>
        </div>
        <div className="mt-3 font-metric-display text-metric-display tracking-tight tabular-nums text-on-surface">
          {data.todayOrders}
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          {data.awaitingPacking} awaiting packing
        </div>
      </div>

      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Pending Action
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-tertiary-fixed/40 text-tertiary">
            <span className="material-symbols-outlined text-[17px]">pending_actions</span>
          </span>
        </div>
        <div className="mt-3 font-metric-display text-metric-display tracking-tight tabular-nums text-tertiary">
          {data.pendingAction}
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-tertiary">
          {formatRs(data.pendingCollection)} pending collection
        </div>
      </div>

      <div className="flex flex-col justify-between px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Completed
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-container/10 text-primary">
            <span className="material-symbols-outlined text-[17px]">task_alt</span>
          </span>
        </div>
        <div className="mt-3 font-metric-display text-metric-display tracking-tight tabular-nums text-on-surface">
          {data.completed}
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-primary">
          {data.dispatched} dispatched orders
        </div>
      </div>

      <div className="col-span-1 flex flex-col justify-between px-5 py-4 md:col-span-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Cancelled / Hold
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-error-container/40 text-error">
            <span className="material-symbols-outlined text-[17px]">assignment_return</span>
          </span>
        </div>
        <div className="mt-3 font-metric-display text-metric-display tracking-tight tabular-nums text-error">
          {data.creditHold + data.cancelled}
        </div>
        <div className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
          {data.creditHold} hold · {data.cancelled} cancelled
        </div>
      </div>
    </div>
  );
}
