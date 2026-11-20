import { formatRs } from "../utils";

type SuppliersFooterProps = {
  start: number;
  end: number;
  total: number;
  rowsPerPage: number;
  onRowsPerPageChange: (value: number) => void;
  filteredPayable: number;
  overdueCount: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const PAGE_SIZES = [10, 25, 50, 100];

export function SuppliersFooter({
  start,
  end,
  total,
  rowsPerPage,
  onRowsPerPageChange,
  filteredPayable,
  overdueCount,
  page,
  totalPages,
  onPageChange,
}: SuppliersFooterProps) {
  const pages = Array.from({ length: Math.max(1, totalPages) }, (_, index) => index + 1);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 py-1">
      <div className="flex items-center gap-4">
        <span className="font-body-dense text-body-dense text-secondary">
          Showing <span className="font-medium text-on-surface">{start}</span> to{" "}
          <span className="font-medium text-on-surface">{end}</span> of{" "}
          <span className="font-medium text-on-surface">{total}</span> suppliers
        </span>
        <div className="flex items-center gap-1.5 border-l border-surface-container-high pl-3">
          <span className="font-body-dense text-body-dense text-secondary">Rows:</span>
          <select
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            className="h-6 cursor-pointer rounded bg-surface-container-lowest px-1.5 font-mono-data-sm text-mono-data-sm text-on-surface focus:outline-none"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
                {size === 100 ? " (Dense)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-body-dense text-body-dense text-secondary">
            Total Filtered Payable:
          </span>
          <span className="font-mono-data text-mono-data font-semibold tabular-nums text-on-surface">
            {formatRs(filteredPayable)}
          </span>
          <span className="rounded bg-error-container px-1.5 py-0.5 font-mono-data-sm text-[10px] font-semibold uppercase text-error">
            {overdueCount} Accounts Overdue
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex h-7 cursor-not-allowed items-center gap-0.5 rounded bg-surface-container px-2 font-body-dense text-body-dense text-outline disabled:opacity-70 enabled:cursor-pointer enabled:bg-surface-container-lowest enabled:text-on-surface enabled:hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[14px]">chevron_left</span>
            Prev
          </button>
          {pages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`flex h-7 w-7 items-center justify-center rounded font-mono-data-sm text-mono-data-sm ${
                pageNumber === page
                  ? "bg-primary-container font-semibold text-on-primary"
                  : "bg-surface-container-lowest text-on-surface transition-colors hover:bg-surface-container"
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex h-7 items-center gap-0.5 rounded bg-surface-container-lowest px-2 font-body-dense text-body-dense text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
