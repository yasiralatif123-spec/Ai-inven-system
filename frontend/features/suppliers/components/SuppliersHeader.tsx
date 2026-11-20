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
    <div className="flex flex-col gap-3 pb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-body-default text-body-default text-secondary">
            Wholesale Operations
          </span>
          <span className="font-body-default text-body-default text-outline-variant">/</span>
          <span className="font-body-medium text-body-medium text-on-surface">
            Supplier Directory
          </span>
          <span className="ml-2 rounded bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm uppercase tracking-wider text-on-surface-variant">
            Master Payables Index
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">
            LEDGER PERIOD: NOV 2026
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
          <span className="font-mono-data-sm font-medium text-mono-data-sm text-primary">
            RECONCILED
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">Suppliers</h1>
          <p className="mt-0.5 font-body-default text-body-default text-secondary">
            Distributor trade accounts, procurement ledgers, and accounts payable obligations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            className="flex h-[34px] items-center gap-1.5 rounded bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[17px] text-secondary">download</span>
            Export
            <span className="pl-0.5 font-mono-data-sm text-mono-data-sm text-secondary">CSV</span>
          </button>
          <button
            type="button"
            onClick={onAgingLedger}
            className="flex h-[34px] items-center gap-1.5 rounded bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[17px] text-secondary">
              receipt_long
            </span>
            Aging Ledger
          </button>
          <button
            type="button"
            onClick={onAddSupplier}
            className="flex h-[34px] items-center gap-1.5 rounded bg-primary-container px-3.5 font-body-medium text-body-medium text-on-primary shadow-sm transition-colors hover:bg-primary"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Supplier
          </button>
        </div>
      </div>
    </div>
  );
}
