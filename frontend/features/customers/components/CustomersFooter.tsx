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
    <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container px-3 py-2.5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span className="font-body-dense text-body-dense text-secondary">
          Showing <span className="font-medium text-on-surface">{start}</span> to{" "}
          <span className="font-medium text-on-surface">{end}</span> of{" "}
          <span className="font-medium text-on-surface">{total}</span> customer
          {total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-2 py-0.5">
          <span className="font-label-caps text-[10px] uppercase text-secondary">Rows:</span>
          <select
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            className="cursor-pointer bg-transparent font-body-dense text-body-dense text-on-surface focus:outline-none"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-7 items-center gap-1 rounded border border-outline-variant bg-surface-container-lowest px-2 font-body-dense text-body-dense text-secondary transition-colors enabled:hover:bg-surface enabled:hover:text-on-surface disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[14px]">chevron_left</span>
          Prev
        </button>
        <div className="flex items-center gap-1 font-mono-data-sm text-mono-data-sm">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`flex h-7 w-7 items-center justify-center rounded font-medium ${
                pageNumber === page
                  ? "bg-primary-container text-on-primary"
                  : "border border-outline-variant bg-surface-container-lowest text-on-surface transition-colors hover:bg-surface"
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
          className="flex h-7 items-center gap-1 rounded border border-outline-variant bg-surface-container-lowest px-2 font-body-dense text-body-dense text-on-surface transition-colors enabled:hover:bg-surface disabled:opacity-40"
        >
          Next
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        </button>
      </div>

      <div className="flex items-center gap-2 rounded border border-outline-variant bg-surface-container-lowest px-2.5 py-1">
        <span className="font-label-caps text-label-caps uppercase text-secondary">
          Filtered Outstanding:
        </span>
        <span className="font-mono-data text-mono-data font-semibold text-on-surface">
          {formatRs(filteredOutstanding)}
        </span>
      </div>
    </div>
  );
}
