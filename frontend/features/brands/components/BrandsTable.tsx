import { formatBrandDate, formatProductCount } from "../utils";
import type { Brand } from "../types";

type BrandsTableProps = {
  brands: Brand[];
  loading: boolean;
  busyBrandId: string | null;
  onDetails: (brand: Brand) => void;
  onEdit: (brand: Brand) => void;
  onToggleStatus: (brand: Brand) => void;
};

export function BrandsTable({
  brands,
  loading,
  busyBrandId,
  onDetails,
  onEdit,
  onToggleStatus,
}: BrandsTableProps) {
  const actionClass =
    "flex h-8 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-body-dense text-body-dense text-on-surface-variant transition duration-200 hover:border-border hover:bg-row-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="h-10 border-b border-outline-variant bg-surface-container-low">
              <th className="px-4 py-2 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Brand Name</th>
              <th className="px-4 py-2 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Description</th>
              <th className="px-4 py-2 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Status</th>
              <th className="px-4 py-2 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Created Date</th>
              <th className="px-4 py-2 text-right font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-body-default text-body-default">
            {loading ? (
              <tr className="animate-pulse">
                <td colSpan={5} className="px-4 py-16 text-center font-body-default text-on-surface-variant">
                  Loading brands...
                </td>
              </tr>
            ) : brands.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
                      <span className="material-symbols-outlined text-[22px]">sell_out</span>
                    </span>
                    <div className="font-body-medium text-body-medium text-on-surface">
                      No brands found.
                    </div>
                    <div className="font-body-dense text-body-dense text-on-surface-variant">
                      Adjust the search and filters, or add a new brand.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr
                  key={brand._id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${brand.name}`}
                  onClick={() => onDetails(brand)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onDetails(brand);
                    }
                  }}
                  className="h-14 cursor-pointer transition duration-200 hover:bg-surface-container-low focus:outline-none focus-visible:bg-row-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-body-medium text-body-medium text-on-surface">{brand.name}</span>
                      <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                        {formatProductCount(brand.productCount)}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-[380px] px-4 py-2.5">
                    <span className="line-clamp-2 font-body-dense text-body-dense text-on-surface-variant">
                      {brand.description || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-1 font-label-caps text-label-caps ${
                        brand.isActive
                          ? "border-primary/20 bg-primary-fixed/30 text-primary"
                          : "border-outline-variant bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {brand.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                    {formatBrandDate(brand.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className={actionClass}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDetails(brand);
                        }}
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        Details
                      </button>
                      <button
                        type="button"
                        className={actionClass}
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(brand);
                        }}
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyBrandId === brand._id}
                        className={actionClass}
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleStatus(brand);
                        }}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {brand.isActive ? "toggle_off" : "toggle_on"}
                        </span>
                        {brand.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
