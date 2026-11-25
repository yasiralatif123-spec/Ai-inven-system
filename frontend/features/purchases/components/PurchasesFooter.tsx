"use client";

type PurchasesFooterProps = {
  totalCount: number;
  visibleCount: number;
  selectedCount: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageAction: (label: string) => void;
};

export function PurchasesFooter({
  totalCount,
  visibleCount,
  selectedCount,
  page,
  totalPages,
  onPageChange,
  onPageAction,
}: PurchasesFooterProps) {
  const start = totalCount === 0 ? 0 : (page - 1) * 10 + 1;
  const end = Math.min(page * 10, visibleCount);

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, page - 2),
    Math.max(0, page - 2) + 5
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-outline-variant/80 bg-surface-container-low px-4 py-3.5 font-body-dense text-body-dense text-on-surface-variant">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>
            Showing <strong className="font-body-medium text-body-medium text-on-surface">{start}</strong> to{" "}
            <strong className="font-body-medium text-body-medium text-on-surface">{end}</strong> of{" "}
            <strong className="font-body-medium text-body-medium text-on-surface">{totalCount}</strong> purchases
          </span>
          <span className="text-outline-variant">|</span>
          <span className="rounded-md border border-outline-variant/70 bg-surface-container-lowest px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            Selected: {selectedCount} row{selectedCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition duration-200 hover:bg-surface-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[17px]">chevron_left</span>
          </button>
          {pages.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onPageChange(value)}
              className={`h-8 w-8 rounded-lg border font-mono-data-sm text-mono-data-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                value === page
                  ? "border-transparent bg-primary-container font-medium text-on-primary shadow-sm"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container"
              }`}
            >
              {value}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition duration-200 hover:bg-surface-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[17px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2.5 font-body-dense text-body-dense text-on-surface-variant">
        <div className="flex flex-wrap items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
          <span>Procurement ledger synced with FBR NTN withholding rules</span>
          <span className="text-outline-variant">·</span>
          <span>
            Double-entry debit: <strong className="font-body-medium text-body-medium text-on-surface">Inventory In-Transit / Creditors</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onPageAction("Batch Reconciliation Log")}
            className="rounded-md font-body-medium text-body-medium text-primary transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            Batch Reconciliation Log
          </button>
        </div>
      </div>
    </div>
  );
}
