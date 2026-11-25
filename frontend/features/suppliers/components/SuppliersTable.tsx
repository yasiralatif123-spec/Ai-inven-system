import type { Supplier } from "../types";
import {
  formatRs,
  getRowClasses,
  getStatusClasses,
} from "../utils";
import { SupplierActionsMenu } from "./SupplierActionsMenu";

type SuppliersTableProps = {
  suppliers: Supplier[];
  selectedIds: string[];
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  openMenuId: string | null;
  onMenuToggle: (id: string) => void;
  onOpenProfile: (supplier: Supplier) => void;
  onCreatePurchase: (supplier: Supplier) => void;
  onRecordPayment: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
};

function PayableCell({ supplier }: { supplier: Supplier }) {
  if (supplier.payableTone === "success") {
    return (
      <div className="flex flex-col items-end">
        <span className="font-mono-data text-mono-data font-medium tabular-nums text-secondary">
          {formatRs(supplier.outstanding)}
        </span>
        <span className="mt-0.5 font-mono-data-sm text-[10px] font-medium text-primary">
          {supplier.payableNote}
        </span>
      </div>
    );
  }

  if (supplier.payableTone === "muted") {
    return (
      <div className="flex flex-col items-end">
        <span className="font-mono-data text-mono-data font-medium tabular-nums text-on-surface">
          {formatRs(supplier.outstanding)}
        </span>
        <span className="font-mono-data-sm text-[10px] text-secondary">
          {supplier.payableNote}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <span className="font-mono-data text-mono-data font-semibold tabular-nums text-error">
        {formatRs(supplier.outstanding)}
      </span>
      <span className="mt-0.5 rounded-md border border-error/20 bg-error-container/50 px-1.5 py-0.5 font-mono-data-sm text-[10px] font-medium uppercase text-error">
        {supplier.payableNote}
      </span>
    </div>
  );
}

export function SuppliersTable({
  suppliers,
  selectedIds,
  onToggleRow,
  onToggleAll,
  openMenuId,
  onMenuToggle,
  onOpenProfile,
  onCreatePurchase,
  onRecordPayment,
  onEdit,
  onDelete,
}: SuppliersTableProps) {
  const allSelected = suppliers.length > 0 && selectedIds.length === suppliers.length;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel">
      <div className="min-h-[580px] overflow-x-auto overflow-y-visible">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-10 select-none border-b border-outline-variant/80 bg-surface-container-low font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              <th className="w-12 px-4 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Select all suppliers"
                  className="h-3.5 w-3.5 cursor-pointer rounded border-outline-variant accent-primary focus:ring-0"
                />
              </th>
              <th className="min-w-[240px] whitespace-nowrap px-4">Supplier &amp; Hub Details</th>
              <th className="min-w-[130px] whitespace-nowrap px-4">Phone (+92)</th>
              <th className="min-w-[190px] whitespace-nowrap px-4">Dispatch Email</th>
              <th className="min-w-[130px] whitespace-nowrap px-4 text-right">Total Purchases</th>
              <th className="min-w-[170px] whitespace-nowrap px-4 text-right">Outstanding Payable</th>
              <th className="min-w-[110px] whitespace-nowrap px-4">Last Purchase</th>
              <th className="min-w-[90px] whitespace-nowrap px-4 text-center">Status</th>
              <th className="w-14 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/70 font-body-default text-body-default">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
                      <span className="material-symbols-outlined text-[22px]">person_search</span>
                    </span>
                    <div className="font-body-medium text-body-medium text-on-surface">
                      No suppliers match the current filters.
                    </div>
                    <div className="mt-0.5 font-body-dense text-body-dense text-on-surface-variant">
                      Adjust the search, payable, status, or region filters to see more accounts.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => {
                const selected = selectedIds.includes(supplier.id);
                const menuOpen = openMenuId === supplier.id;

                return (
                  <tr
                    key={supplier.id}
                    onClick={() => onOpenProfile(supplier)}
                    className={`cursor-pointer transition-colors ${getRowClasses(supplier, selected)}`}
                  >
                    <td className="mt-0.5 px-4 py-3 text-center align-top">
                      <input
                        type="checkbox"
                        checked={selected}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => onToggleRow(supplier.id)}
                        aria-label={`Select ${supplier.name}`}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-outline-variant accent-primary focus:ring-0"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-body-medium text-body-medium leading-tight text-on-surface">
                            {supplier.name}
                          </span>
                          <span className="rounded-md border border-outline-variant/70 bg-surface-container-high px-1.5 py-0.5 font-mono-data-sm text-[10px] text-secondary">
                            #{supplier.code}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="font-body-dense text-body-dense text-secondary">
                            {supplier.contact}
                          </span>
                          <span className="font-mono-data-sm text-outline-variant">·</span>
                          <span className="rounded-md border border-outline-variant/70 bg-surface-container px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                            {supplier.hub}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="font-mono-data text-mono-data tabular-nums text-on-surface-variant">
                        {supplier.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="block max-w-[190px] truncate font-body-default text-body-default text-on-surface-variant">
                        {supplier.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <span className="font-mono-data text-mono-data font-medium tabular-nums text-on-surface">
                        {formatRs(supplier.totalPurchases)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <PayableCell supplier={supplier} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                        {supplier.lastPurchase}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center align-top">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-label-caps text-[10px] font-semibold uppercase tracking-wider ${getStatusClasses(
                          supplier.status
                        )}`}
                      >
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center align-top">
                      <SupplierActionsMenu
                        supplier={supplier}
                        open={menuOpen}
                        highlighted={menuOpen}
                        onToggle={() => onMenuToggle(supplier.id)}
                        onOpenProfile={onOpenProfile}
                        onCreatePurchase={onCreatePurchase}
                        onRecordPayment={onRecordPayment}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
