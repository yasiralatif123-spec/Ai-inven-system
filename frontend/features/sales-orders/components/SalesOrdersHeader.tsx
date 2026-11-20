type SalesOrdersHeaderProps = {
  onExport: () => void;
  onNewOrder: () => void;
};

export function SalesOrdersHeader({ onExport, onNewOrder }: SalesOrdersHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-1">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Sales &amp; Orders</span>
          <span className="inline-flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></span>
            Terminal #02 · PK-LHE-01
          </span>
        </div>
        <p className="mt-0.5 font-body-dense text-body-dense text-secondary">
          Inventory-backed sales, payment tracking, and real-time dispatch fulfillment
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 rounded border border-outline-variant bg-surface-container-low px-2.5 py-1">
          <div className="flex items-center gap-1.5">
            <span
              className="material-symbols-outlined text-[15px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="font-label-caps text-label-caps uppercase text-secondary">FBR e-Invoicing:</span>
          </div>
          <span className="font-mono-data-sm text-mono-data-sm font-medium text-on-surface">Synced 4m ago</span>
        </div>

        <button
          type="button"
          onClick={onExport}
          className="flex h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[16px] text-secondary">download</span>
          Export Invoices (CSV)
        </button>

        <button
          type="button"
          onClick={onNewOrder}
          className="flex h-[34px] items-center gap-1.5 rounded bg-primary-container px-3.5 font-body-medium text-body-medium text-on-primary shadow-sm transition-colors hover:bg-primary"
        >
          <span className="material-symbols-outlined text-[17px]">add</span>
          + New Sale Order
        </button>
      </div>
    </div>
  );
}
