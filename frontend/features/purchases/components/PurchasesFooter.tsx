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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low px-4 py-3 text-body-dense">
        <div className="flex flex-wrap items-center gap-2 text-secondary">
          <span>
            Showing <strong className="text-on-surface">{start}</strong> to{" "}
            <strong className="text-on-surface">{end}</strong> of{" "}
            <strong className="text-on-surface">{totalCount}</strong> purchases
          </span>
          <span className="text-outline-variant">|</span>
          <span className="font-mono-data-sm text-[11px]">
            Selected: {selectedCount} row{selectedCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
            className="flex h-7 w-7 items-center justify-center rounded border border-outline-variant bg-surface-container-lowest text-secondary disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          {pages.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onPageChange(value)}
              className={`h-7 w-7 rounded border font-mono-data-sm text-[11px] ${
                value === page
                  ? "border-transparent bg-primary font-medium text-on-primary"
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
            className="flex h-7 w-7 items-center justify-center rounded border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1 font-mono-data-sm text-mono-data-sm text-secondary">
        <div className="flex flex-wrap items-center gap-2">
          <span className="material-symbols-outlined text-[15px] text-primary">verified_user</span>
          <span>Procurement ledger synced with FBR NTN withholding rules</span>
          <span className="text-outline-variant">·</span>
          <span>
            Double-entry debit: <strong className="text-on-surface">Inventory In-Transit / Creditors</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onPageAction("Batch Reconciliation Log")}
            className="text-primary hover:underline"
          >
            Batch Reconciliation Log
          </button>
        </div>
      </div>
    </div>
  );
}
