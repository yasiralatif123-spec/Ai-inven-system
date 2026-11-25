type BrandsHeaderProps = {
  total: number;
  active: number;
  onAdd: () => void;
};

export function BrandsHeader({ total, active, onAdd }: BrandsHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">Brands</h1>
          <span className="rounded-md border border-outline-variant bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            {total} total · {active} active
          </span>
        </div>
        <p className="font-body-default text-body-default text-on-surface-variant">
          Manage product brands.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px active:bg-primary-hover/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="material-symbols-outlined text-[19px]">add</span>
        <span>Add Brand</span>
      </button>
    </div>
  );
}
