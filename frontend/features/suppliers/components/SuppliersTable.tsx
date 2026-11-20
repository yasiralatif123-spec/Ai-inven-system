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
        <span className="mt-0.5 font-mono-data-sm text-[10px] text-primary">
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
      <span className="font-mono-data text-mono-data font-medium tabular-nums text-error">
        {formatRs(supplier.outstanding)}
      </span>
      <span className="mt-0.5 rounded bg-error-container px-1.5 py-0.5 font-mono-data-sm text-[10px] font-medium uppercase text-error">
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
    <div className="relative min-h-[580px] w-full overflow-x-auto rounded bg-surface-container-lowest shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="h-9 select-none bg-surface-container-low">
            <th className="w-10 px-3 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Select all suppliers"
                className="h-3.5 w-3.5 cursor-pointer rounded border-outline-variant accent-primary"
              />
            </th>
            <th className="min-w-[240px] px-3.5 py-2 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Supplier &amp; Hub Details
            </th>
            <th className="min-w-[130px] px-3 py-2 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Phone (+92)
            </th>
            <th className="min-w-[190px] px-3 py-2 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Dispatch Email
            </th>
            <th className="min-w-[130px] px-3 py-2 text-right font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Total Purchases
            </th>
            <th className="min-w-[170px] px-3 py-2 text-right font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Outstanding Payable
            </th>
            <th className="min-w-[110px] px-3 py-2 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Last Purchase
            </th>
            <th className="min-w-[90px] px-3 py-2 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Status
            </th>
            <th className="w-12 px-2 py-2 text-center font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container">
          {suppliers.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-12 text-center">
                <div className="font-body-medium text-body-medium text-on-surface">
                  No suppliers match the current filters.
                </div>
                <div className="mt-1 font-body-dense text-body-dense text-secondary">
                  Adjust the search, payable, status, or region filters to see more accounts.
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
                  className={`cursor-pointer ${getRowClasses(supplier, selected)}`}
                >
                  <td className="px-3 py-2 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selected}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => onToggleRow(supplier.id)}
                      aria-label={`Select ${supplier.name}`}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-outline-variant accent-primary"
                    />
                  </td>
                  <td className="px-3.5 py-2 align-middle">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-body-medium text-body-medium text-on-surface">
                          {supplier.name}
                        </span>
                        <span className="rounded bg-surface px-1.5 py-0.5 font-mono-data-sm text-[10px] text-secondary">
                          #{supplier.code}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="font-body-dense text-body-dense text-secondary">
                          {supplier.contact}
                        </span>
                        <span className="font-mono-data-sm text-outline-variant">·</span>
                        <span className="rounded bg-surface-container px-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                          {supplier.hub}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className="font-mono-data text-mono-data text-on-surface">
                      {supplier.phone}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className="block max-w-[190px] truncate font-body-default text-body-default text-on-surface-variant">
                      {supplier.email}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right align-middle">
                    <span className="font-mono-data text-mono-data font-medium tabular-nums text-on-surface">
                      {formatRs(supplier.totalPurchases)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right align-middle">
                    <PayableCell supplier={supplier} />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface">
                      {supplier.lastPurchase}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 font-label-caps text-[10px] uppercase tracking-wider ${getStatusClasses(
                        supplier.status
                      )}`}
                    >
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center align-middle">
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
  );
}
