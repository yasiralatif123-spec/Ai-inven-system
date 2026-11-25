import { PAGE_SIZES } from "../constants";

type BrandsFooterProps = {
  total: number;
  page: number;
  totalPages: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (value: number) => void;
};

export function BrandsFooter({
  total,
  page,
  totalPages,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: BrandsFooterProps) {
  const start = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, total);
  const pages = Array.from({ length: Math.max(1, totalPages) }, (_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-4 py-3 shadow-panel">
      <div className="flex items-center gap-2 font-body-dense text-body-dense text-on-surface-variant">
        <span>
          Showing {start}-{end} of {total}
        </span>
        <label className="sr-only" htmlFor="brand-rows-per-page">
          Rows per page
        </label>
        <select
          id="brand-rows-per-page"
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          className="h-8 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 font-mono-data-sm text-mono-data-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-8 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-body-dense text-body-dense text-on-surface-variant transition duration-200 hover:bg-row-hover disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-[15px]">chevron_left</span>
          Prev
        </button>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono-data-sm text-mono-data-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              pageNumber === page
                ? "border border-primary bg-primary font-semibold text-on-primary shadow-sm"
                : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-row-hover hover:text-on-surface"
            }`}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-body-dense text-body-dense text-on-surface-variant transition duration-200 hover:bg-row-hover disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Next
          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
