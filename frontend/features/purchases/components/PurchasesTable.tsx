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
  Draft: "border border-outline-variant bg-surface-container text-on-surface-variant",
  Ordered: "border border-outline-variant bg-secondary-container/60 text-on-secondary-container",
  "Partially Received": "border border-tertiary-fixed/70 bg-tertiary-fixed/30 text-on-tertiary-fixed-variant",
  Received: "border border-primary/20 bg-primary-fixed/30 text-primary",
  Cancelled: "border border-error/20 bg-error-container/40 text-on-error-container",
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
    <div className="relative w-full overflow-visible rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-10 border-b border-outline-variant/80 bg-surface-container-low">
              <th className="w-12 px-4 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Select all purchases"
                  className="cursor-pointer rounded border-outline text-primary focus:ring-0"
                />
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Purchase ID
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Supplier
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Purchased Products (Recv/Ordered)
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Date
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Total Amount
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Paid Amount
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Remaining Balance
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Status
              </th>
              <th className="w-16 px-4 py-3 text-center font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/70 font-body-default text-body-default">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[28px] text-outline">
                      receipt_long
                    </span>
                    <div className="font-body-medium text-body-medium text-on-surface">
                      No purchases match this view
                    </div>
                    <div className="mt-0.5 font-body-dense text-body-dense text-on-surface-variant">
                      Adjust the filters or create a purchase to see saved records.
                    </div>
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
                    <td className="px-4 py-4 text-center" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleRow(purchase.id)}
                        aria-label={`Select ${purchase.id}`}
                        className="cursor-pointer rounded border-outline text-primary focus:ring-0"
                      />
                    </td>
                    <td className="px-4 py-4 font-mono-data text-mono-data text-on-surface">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenSupplierProfile(purchase);
                        }}
                        className="flex items-center gap-1 rounded-md font-medium text-primary transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
                      >
                        <span className={cancelled ? "line-through" : ""}>{purchase.id}</span>
                        <span className="material-symbols-outlined text-[13px] text-on-surface-variant">
                          open_in_new
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`font-body-medium text-body-medium text-on-surface ${
                            cancelled ? "text-secondary line-through" : ""
                          }`}
                        >
                          {purchase.supplier}
                        </span>
                        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                          {purchase.account}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[320px] px-4 py-4">
                      <div className="flex max-h-28 flex-col gap-2 overflow-y-auto pr-1">
                        {purchase.dto.items.map((item, index) => {
                          const received = Number(item.receivedQuantity) || 0;
                          const remaining = Math.max((Number(item.quantity) || 0) - received, 0);

                          return (
                            <div
                              key={item.id || `${item.sku || item.name}-${index}`}
                              className="rounded-md bg-surface-container-low/70 px-2 py-1.5"
                            >
                              <div
                                className={`font-body-medium text-body-medium text-on-surface ${
                                  cancelled ? "text-secondary line-through" : ""
                                }`}
                              >
                                {item.name}
                              </div>
                              <div className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
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
                      className={`whitespace-nowrap px-4 py-4 font-mono-data text-mono-data text-on-surface-variant ${
                        cancelled ? "line-through" : ""
                      }`}
                    >
                      {purchase.date}
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-mono-data text-mono-data font-medium tabular-nums text-on-surface ${
                        cancelled ? "text-secondary line-through" : ""
                      }`}
                    >
                      {formatRs(purchase.total)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono-data text-mono-data tabular-nums text-on-surface-variant">
                      {formatRs(purchase.paid)}
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-mono-data text-mono-data tabular-nums ${
                        purchase.remaining > 0 ? "font-medium text-error" : "text-on-surface-variant"
                      }`}
                    >
                      {formatRs(purchase.remaining)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 font-label-caps text-label-caps ${STATUS_CLASSES[purchase.status]}`}
                      >
                        {purchase.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-4 text-center"
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
