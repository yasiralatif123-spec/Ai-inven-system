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
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-4 py-3 shadow-panel xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-body-dense text-body-dense text-on-surface-variant">
          Showing <span className="font-medium text-on-surface">{start}</span> to{" "}
          <span className="font-medium text-on-surface">{end}</span> of{" "}
          <span className="font-medium text-on-surface">{total}</span> suppliers
        </span>
        <div className="flex h-8 items-center gap-2 border-l border-outline-variant/80 pl-3">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Rows:
          </span>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-2 text-on-surface transition duration-200 hover:border-outline focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container">
            <select
              value={rowsPerPage}
              onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
              className="cursor-pointer appearance-none bg-transparent font-mono-data-sm text-mono-data-sm focus:outline-none"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                  {size === 100 ? " (Dense)" : ""}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[15px] text-on-surface-variant">
              expand_more
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body-dense text-body-dense text-on-surface-variant">
            Total Filtered Payable:
          </span>
          <span className="font-mono-data text-mono-data font-semibold tabular-nums text-on-surface">
            {formatRs(filteredPayable)}
          </span>
          <span className="rounded-md border border-error/20 bg-error-container/50 px-2 py-0.5 font-mono-data-sm text-[10px] font-semibold uppercase text-error">
            {overdueCount} Accounts Overdue
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex h-8 items-center gap-0.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-body-dense text-body-dense text-on-surface-variant transition duration-200 enabled:hover:border-outline enabled:hover:bg-surface enabled:hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[15px]">chevron_left</span>
            Prev
          </button>
          {pages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono-data-sm text-mono-data-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                pageNumber === page
                  ? "border border-primary-container bg-primary-container font-semibold text-on-primary shadow-sm"
                  : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline hover:bg-surface hover:text-on-surface"
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex h-8 items-center gap-0.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-body-dense text-body-dense text-on-surface transition duration-200 enabled:hover:border-outline enabled:hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            Next
            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
