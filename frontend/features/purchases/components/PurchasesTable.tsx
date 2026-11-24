"use client";

import type { PurchaseRecord, PurchaseStatus } from "../purchaseData";
import { formatRs, formatUnitPrice } from "../utils";
import { PurchaseActionsMenu } from "./PurchaseActionsMenu";

type PurchasesTableProps = {
  purchases: PurchaseRecord[];
  selectedIds: string[];
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  openMenuId: string | null;
  onMenuToggle: (id: string) => void;
  onAction: (action: string, purchase: PurchaseRecord) => void;
  onOpenSupplierProfile: (purchase: PurchaseRecord) => void;
};

const STATUS_CLASSES: Record<PurchaseStatus, string> = {
  Draft: "border border-gray-300 bg-gray-100 text-gray-700",
  Ordered: "border border-slate-300 bg-slate-100 text-slate-700",
  "Partially Received": "border border-amber-300 bg-amber-50 text-amber-800",
  Received: "border border-emerald-300 bg-emerald-50 text-emerald-800",
  Cancelled: "border border-red-300 bg-red-50 text-red-800",
};

export function PurchasesTable({
  purchases,
  selectedIds,
  onToggleRow,
  onToggleAll,
  openMenuId,
  onMenuToggle,
  onAction,
  onOpenSupplierProfile,
}: PurchasesTableProps) {
  const allSelected = purchases.length > 0 && selectedIds.length === purchases.length;

  return (
    <div className="relative w-full overflow-visible rounded border border-outline-variant bg-surface-container-lowest">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-8 border-b border-outline-variant bg-surface-container-low">
              <th className="w-10 px-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Select all purchases"
                  className="cursor-pointer rounded border-outline text-primary focus:ring-0"
                />
              </th>
              <th className="px-3 py-2 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Purchase ID
              </th>
              <th className="px-3 py-2 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Supplier
              </th>
              <th className="px-3 py-2 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Purchased Products (Recv/Ordered)
              </th>
              <th className="px-3 py-2 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Date
              </th>
              <th className="px-3 py-2 text-right font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Total Amount
              </th>
              <th className="px-3 py-2 text-right font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Paid Amount
              </th>
              <th className="px-3 py-2 text-right font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Remaining Balance
              </th>
              <th className="px-3 py-2 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Status
              </th>
              <th className="w-14 px-3 py-2 text-center font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-body-default text-body-default">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center">
                  <div className="font-body-medium text-body-medium text-on-surface">
                    No purchases match this view
                  </div>
                  <div className="mt-1 font-body-dense text-body-dense text-secondary">
                    Adjust the filters or create a purchase to see saved records.
                  </div>
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => {
                const selected = selectedIds.includes(purchase.id);
                const cancelled = purchase.status === "Cancelled";

                return (
                  <tr
                    key={purchase.id}
                    onClick={() => onOpenSupplierProfile(purchase)}
                    className={`cursor-pointer bg-surface-container-lowest transition-colors hover:bg-surface-container/60 ${
                      cancelled ? "bg-surface-container-low/40 opacity-75" : ""
                    }`}
                  >
                    <td className="px-3 py-4 text-center" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleRow(purchase.id)}
                        aria-label={`Select ${purchase.id}`}
                        className="cursor-pointer rounded border-outline text-primary focus:ring-0"
                      />
                    </td>
                    <td className="px-3 py-4 font-mono-data text-mono-data text-on-surface">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenSupplierProfile(purchase);
                        }}
                        className="flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        <span className={cancelled ? "line-through" : ""}>{purchase.id}</span>
                        <span className="material-symbols-outlined text-[13px] text-outline">
                          open_in_new
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col">
                        <span
                          className={`font-body-medium text-body-medium text-on-surface ${
                            cancelled ? "text-secondary line-through" : ""
                          }`}
                        >
                          {purchase.supplier}
                        </span>
                        <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                          {purchase.account}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-xs px-3 py-4">
                      <div className="flex max-h-24 flex-col gap-1.5 overflow-y-auto pr-1">
                        {purchase.dto.items.map((item, index) => {
                          const received = Number(item.receivedQuantity) || 0;
                          const remaining = Math.max((Number(item.quantity) || 0) - received, 0);

                          return (
                            <div key={item.id || `${item.sku || item.name}-${index}`}>
                              <div
                                className={`font-body-medium text-body-medium text-on-surface ${
                                  cancelled ? "text-secondary line-through" : ""
                                }`}
                              >
                                {item.name}
                              </div>
                              <div className="font-mono-data-sm text-mono-data-sm text-secondary">
                                {item.sku || "Manual"} · {received}/{item.quantity} {item.unit} ·{" "}
                                {formatUnitPrice(item.unitPrice, item.unit)}
                                {remaining > 0 ? ` · ${remaining} pending` : ""}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-4 font-mono-data text-mono-data text-secondary ${
                        cancelled ? "line-through" : ""
                      }`}
                    >
                      {purchase.date}
                    </td>
                    <td
                      className={`px-3 py-4 text-right font-mono-data font-medium tabular-nums text-on-surface ${
                        cancelled ? "text-secondary line-through" : ""
                      }`}
                    >
                      {formatRs(purchase.total)}
                    </td>
                    <td className="px-3 py-4 text-right font-mono-data tabular-nums text-secondary">
                      {formatRs(purchase.paid)}
                    </td>
                    <td
                      className={`px-3 py-4 text-right font-mono-data tabular-nums ${
                        purchase.remaining > 0 ? "font-medium text-error" : "text-secondary"
                      }`}
                    >
                      {formatRs(purchase.remaining)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 font-label-caps text-label-caps ${STATUS_CLASSES[purchase.status]}`}
                      >
                        {purchase.status}
                      </span>
                    </td>
                    <td
                      className="px-3 py-4 text-center"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <PurchaseActionsMenu
                        purchase={purchase}
                        open={openMenuId === purchase.id}
                        onToggle={() => onMenuToggle(purchase.id)}
                        onAction={(action) => onAction(action, purchase)}
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
