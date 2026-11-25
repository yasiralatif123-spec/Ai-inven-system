type SalesOrdersHeaderProps = {
  onExport: () => void;
  onNewOrder: () => void;
};

export function SalesOrdersHeader({ onExport, onNewOrder }: SalesOrdersHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-1">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3 border-b border-outline-variant/80 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
              Sales &amp; Orders
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Terminal #02 · PK-LHE-01
            </span>
          </div>
          <p className="font-body-default text-body-default text-on-surface-variant">
            Inventory-backed sales, payment tracking, and real-time dispatch fulfillment
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-outline-variant/70 bg-surface-container-low px-2.5 py-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className="material-symbols-outlined text-[16px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                FBR e-Invoicing:
              </span>
            </div>
            <span className="font-mono-data-sm text-mono-data-sm font-medium text-on-surface">
              Synced 4m ago
            </span>
          </div>

          <button
            type="button"
            onClick={onExport}
            className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
              download
            </span>
            Export Invoices (CSV)
          </button>

          <button
            type="button"
            onClick={onNewOrder}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px active:bg-primary-hover/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            + New Sale Order
          </button>
        </div>
      </div>
    </div>
  );
}
