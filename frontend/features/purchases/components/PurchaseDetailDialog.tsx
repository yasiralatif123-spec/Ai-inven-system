"use client";

import type { PurchaseRecord } from "../purchaseData";
import { formatDate, formatRs, itemRemainingQuantity, paymentTermsLabel } from "../utils";

type PurchaseDetailDialogProps = {
  purchase: PurchaseRecord | null;
  onClose: () => void;
};

export function PurchaseDetailDialog({ purchase, onClose }: PurchaseDetailDialogProps) {
  if (!purchase) return null;

  const { dto } = purchase;
  const paid = purchase.paid;
  const remaining = purchase.remaining;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div className="w-full max-w-3xl rounded-xl bg-surface-container-lowest p-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-outline-variant pb-3">
          <div>
            <p className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Saved Purchase Order
            </p>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-md text-headline-md text-on-surface">{purchase.id}</h2>
              <span className="rounded bg-secondary-container px-2 py-0.5 font-label-caps text-label-caps uppercase text-on-secondary-container">
                {purchase.status}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close purchase detail"
            className="flex h-8 w-8 items-center justify-center rounded text-outline hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 font-body-dense text-body-dense text-on-surface">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Supplier</span>
            <span className="font-body-medium text-body-medium">
              {dto.supplier.name} (#{dto.supplier.code})
            </span>
            <span className="font-mono-data-sm text-mono-data-sm text-secondary">
              {dto.supplier.contact} · {dto.supplier.phone}
              <br />
              {dto.supplier.address}
              <br />
              {paymentTermsLabel(dto.supplier.paymentTerms)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono-data-sm text-mono-data-sm">
            <div>
              <span className="block font-label-caps text-label-caps uppercase text-secondary">
                Purchase Date
              </span>
              {formatDate(dto.purchaseDate)}
            </div>
            <div>
              <span className="block font-label-caps text-label-caps uppercase text-secondary">
                Expected Delivery
              </span>
              {formatDate(dto.expectedDelivery)}
            </div>
            <div className="col-span-2">
              <span className="block font-label-caps text-label-caps uppercase text-secondary">
                Supplier Invoice #
              </span>
              {dto.invoiceNumber || "—"}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-outline-variant">
          <table className="w-full border-collapse text-left font-body-dense text-body-dense">
            <thead className="bg-surface-container font-label-caps text-label-caps uppercase text-secondary">
              <tr>
                <th className="px-3 py-2">Product / SKU</th>
                <th className="px-3 py-2 text-right">Ordered</th>
                <th className="px-3 py-2 text-right">Received</th>
                <th className="px-3 py-2 text-right">Remaining</th>
                <th className="px-3 py-2 text-right">Unit Price</th>
                <th className="px-3 py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {dto.items.map((item, index) => (
                <tr key={`${item.sku || item.name}-${index}`}>
                  <td className="px-3 py-2">
                    <span className="block font-body-medium text-body-medium text-on-surface">
                      {item.name}
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                      {item.sku || "Manual item"}
                      {Array.isArray(item.flavor)
                        ? item.flavor.length
                          ? ` · ${item.flavor.join(", ")}`
                          : ""
                        : item.flavor
                          ? ` · ${item.flavor}`
                          : ""}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono-data">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-3 py-2 text-right font-mono-data text-primary">
                    {Number(item.receivedQuantity) || 0} {item.unit}
                  </td>
                  <td className="px-3 py-2 text-right font-mono-data">
                    {itemRemainingQuantity(item)} {item.unit}
                  </td>
                  <td className="px-3 py-2 text-right font-mono-data">
                    {formatRs(item.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono-data">
                    {formatRs(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded bg-surface-container p-3">
            <p className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Payment Ledger
            </p>
            <div className="mt-2 flex items-center justify-between font-body-dense text-body-dense">
              <span className="text-secondary">Total</span>
              <span>{formatRs(dto.financials.total)}</span>
            </div>
            <div className="flex items-center justify-between font-body-dense text-body-dense">
              <span className="text-secondary">Paid</span>
              <span className="text-primary">{formatRs(paid)}</span>
            </div>
            <div className="flex items-center justify-between font-body-dense text-body-dense">
              <span className="text-secondary">Remaining</span>
              <span className={remaining > 0 ? "text-error" : "text-secondary"}>
                {formatRs(remaining)}
              </span>
            </div>
            {dto.payments?.length ? (
              <div className="mt-2 border-t border-outline-variant pt-2">
                {dto.payments.map((payment) => (
                  <div
                    key={payment.paidAt + payment.amount}
                    className="flex items-center justify-between font-mono-data-sm text-mono-data-sm text-secondary"
                  >
                    <span>
                      {formatDate(payment.paidAt)} · {payment.method}
                    </span>
                    <span>{formatRs(payment.amount)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <div className="rounded bg-surface-container-low p-3 font-body-dense text-body-dense text-secondary">
              <span className="font-label-caps text-label-caps uppercase text-on-surface">
                Dispatch Notes
              </span>
              <p className="mt-1 whitespace-pre-wrap">{dto.notes || "—"}</p>
            </div>
            <div className="rounded bg-surface-container-low p-3 font-mono-data-sm text-mono-data-sm text-secondary">
              Created by {dto.createdBy} · {formatDate(dto.createdAt)}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-outline-variant pt-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded bg-primary-container px-4 font-body-medium text-body-medium text-on-primary hover:bg-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
