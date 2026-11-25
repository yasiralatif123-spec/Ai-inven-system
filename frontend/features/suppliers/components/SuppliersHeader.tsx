type SuppliersHeaderProps = {
  onExport: () => void;
  onAgingLedger: () => void;
  onAddSupplier: () => void;
};

export function SuppliersHeader({
  onExport,
  onAgingLedger,
  onAddSupplier,
}: SuppliersHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-1">
      <div className="flex flex-col gap-2 border-b border-outline-variant/80 pb-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          <span>Wholesale Operations</span>
          <span className="text-outline-variant">/</span>
          <span className="font-medium text-primary">Supplier Directory</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
            Suppliers
          </h1>
          <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm uppercase tracking-wider text-on-surface-variant">
            Master Payables Index
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="max-w-2xl font-body-default text-body-default text-on-surface-variant">
            Distributor trade accounts, procurement ledgers, and accounts payable obligations.
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              LEDGER PERIOD: NOV 2026
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono-data-sm font-medium text-mono-data-sm text-primary">
              RECONCILED
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onExport}
          className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface shadow-none transition duration-200 hover:border-outline hover:bg-surface-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <span className="material-symbols-outlined text-[17px] text-on-surface-variant">download</span>
          Export
          <span className="pl-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">CSV</span>
        </button>
        <button
          type="button"
          onClick={onAgingLedger}
          className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface shadow-none transition duration-200 hover:border-outline hover:bg-surface-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
            receipt_long
          </span>
          Aging Ledger
        </button>
        <button
          type="button"
          onClick={onAddSupplier}
          className="flex h-9 items-center gap-2 rounded-lg bg-primary-container px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary active:translate-y-px active:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Supplier
        </button>
      </div>
    </div>
  );
}
