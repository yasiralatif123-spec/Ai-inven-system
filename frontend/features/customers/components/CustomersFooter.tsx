import { PAGE_SIZES } from "../constants";
import { formatRs } from "../utils";

type CustomersFooterProps = {
  start: number;
  end: number;
  total: number;
  filteredOutstanding: number;
  rowsPerPage: number;
  onRowsPerPageChange: (value: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function CustomersFooter({
  start,
  end,
  total,
  filteredOutstanding,
  rowsPerPage,
  onRowsPerPageChange,
  page,
  totalPages,
  onPageChange,
}: CustomersFooterProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-4 py-3 shadow-panel lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-body-dense text-body-dense text-on-surface-variant">
          Showing <span className="font-medium text-on-surface">{start}</span> to{" "}
          <span className="font-medium text-on-surface">{end}</span> of{" "}
          <span className="font-medium text-on-surface">{total}</span> customer
          {total === 1 ? "" : "s"}
        </span>
        <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-2.5 text-on-surface transition duration-200 hover:border-outline focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Rows:
          </span>
          <select
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            className="cursor-pointer appearance-none bg-transparent font-mono-data-sm text-mono-data-sm focus:outline-none"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[15px] text-on-surface-variant">
            expand_more
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-body-dense text-body-dense text-on-surface-variant transition duration-200 enabled:hover:border-outline enabled:hover:bg-surface enabled:hover:text-on-surface disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <span className="material-symbols-outlined text-[15px]">chevron_left</span>
          Prev
        </button>
        <div className="flex items-center gap-1 font-mono-data-sm text-mono-data-sm">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                pageNumber === page
                  ? "border border-primary-container bg-primary-container text-on-primary shadow-sm"
                  : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline hover:bg-surface hover:text-on-surface"
              }`}
            >
              {pageNumber}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-body-dense text-body-dense text-on-surface transition duration-200 enabled:hover:border-outline enabled:hover:bg-surface disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          Next
          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-outline-variant/80 bg-surface-container px-3 py-1.5 lg:ml-auto">
        <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          Filtered Outstanding:
        </span>
        <span className="font-mono-data text-mono-data font-semibold tabular-nums text-on-surface">
          {formatRs(filteredOutstanding)}
        </span>
      </div>
    </div>
  );
}
