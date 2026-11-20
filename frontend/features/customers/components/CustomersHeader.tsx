type CustomersHeaderProps = {
  onExport: () => void;
  onAddCustomer: () => void;
};

export function CustomersHeader({ onExport, onAddCustomer }: CustomersHeaderProps) {
  return (
    <div className="flex flex-col gap-3 pb-1 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
          <span>Wholesale Operations</span>
          <span className="text-outline-variant">/</span>
          <span className="font-medium text-primary">Customer Accounts</span>
        </div>
        <div className="flex items-baseline gap-3">
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
            Customers
          </h1>
          <span className="rounded border border-outline-variant bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
            Master Ledger Index
          </span>
        </div>
        <p className="max-w-2xl font-body-default text-body-default text-on-surface-variant">
          Wholesale client ledger accounts, credit exposures, and dispatch histories.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="flex h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface shadow-none transition-colors hover:border-outline hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            download
          </span>
          <span>Export CSV</span>
        </button>
        <button
          type="button"
          onClick={onAddCustomer}
          className="flex h-[34px] items-center gap-1.5 rounded bg-primary-container px-3.5 font-body-medium text-body-medium text-on-primary transition-colors hover:bg-primary"
        >
          <span className="material-symbols-outlined text-[17px]">add</span>
          <span>Add Customer</span>
        </button>
      </div>
    </div>
  );
}
