type CustomersHeaderProps = {
  onExport: () => void;
  onAddCustomer: () => void;
};

export function CustomersHeader({ onExport, onAddCustomer }: CustomersHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-1">
      <div className="flex flex-col gap-2 border-b border-outline-variant/80 pb-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          <span>Wholesale Operations</span>
          <span className="text-outline-variant">/</span>
          <span className="font-medium text-primary">Customer Accounts</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
            Customers
          </h1>
          <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            Master Ledger Index
          </span>
        </div>

        <p className="max-w-2xl font-body-default text-body-default text-on-surface-variant">
          Wholesale client ledger accounts, credit exposures, and dispatch histories.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onExport}
          className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface shadow-none transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
            download
          </span>
          <span>Export CSV</span>
        </button>
        <button
          type="button"
          onClick={onAddCustomer}
          className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px active:bg-primary-hover/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add Customer</span>
        </button>
      </div>
    </div>
  );
}
