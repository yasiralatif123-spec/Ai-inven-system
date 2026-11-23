"use client";

import type { Supplier } from "../../suppliers/types";
import type { PurchaseFinancials, PurchaseLineItem } from "../types";
import { calculateLineTotal, formatDate, formatRs, paymentTermsLabel } from "../utils";

type PurchasePreviewDialogProps = {
  open: boolean;
  onClose: () => void;
  purchaseCode: string;
  supplier: Supplier | null;
  items: PurchaseLineItem[];
  totals: PurchaseFinancials;
  purchaseDate: string;
  expectedDelivery: string;
  invoiceNumber: string;
  notes: string;
};

export function PurchasePreviewDialog({
  open,
  onClose,
  purchaseCode,
  supplier,
  items,
  totals,
  purchaseDate,
  expectedDelivery,
  invoiceNumber,
  notes,
}: PurchasePreviewDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div className="w-full max-w-3xl rounded-xl bg-surface-container-lowest p-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-outline-variant pb-3">
          <div>
            <p className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Purchase Order Preview
            </p>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {purchaseCode}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-8 w-8 items-center justify-center rounded text-outline hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 font-body-dense text-body-dense text-on-surface">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Supplier</span>
            <span className="font-body-medium text-body-medium">
              {supplier ? `${supplier.name} (#${supplier.code})` : "No supplier selected"}
            </span>
            {supplier ? (
              <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                {supplier.contact} · {supplier.phone}
                <br />
                {supplier.address}
                <br />
                {paymentTermsLabel(supplier.paymentTerms)}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono-data-sm text-mono-data-sm">
            <div>
              <span className="block font-label-caps text-label-caps uppercase text-secondary">
                Purchase Date
              </span>
              {formatDate(purchaseDate)}
            </div>
            <div>
              <span className="block font-label-caps text-label-caps uppercase text-secondary">
                Expected Delivery
              </span>
              {formatDate(expectedDelivery)}
            </div>
            <div className="col-span-2">
              <span className="block font-label-caps text-label-caps uppercase text-secondary">
                Supplier Invoice #
              </span>
              {invoiceNumber || "—"}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-outline-variant">
          <table className="w-full border-collapse text-left font-body-dense text-body-dense">
            <thead className="bg-surface-container font-label-caps text-label-caps uppercase text-secondary">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Unit Price</th>
                <th className="px-3 py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items.map((item) => (
                <tr key={item.rowId}>
                  <td className="px-3 py-2">
                    <span className="block font-body-medium text-body-medium text-on-surface">
                      {item.name || "Untitled item"}
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                      {item.sku || "Manual item"}
                      
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono-data">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-3 py-2 text-right font-mono-data">
                    {formatRs(item.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono-data">
                    {formatRs(calculateLineTotal(item))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-sm font-body-dense text-body-dense text-secondary">
            <span className="font-label-caps text-label-caps uppercase text-on-surface">
              Dispatch Notes
            </span>
            <p className="whitespace-pre-wrap">{notes || "—"}</p>
          </div>
          <div className="min-w-[220px] rounded bg-surface-container p-3">
            <div className="flex items-center justify-between font-body-dense text-body-dense">
              <span className="text-secondary">Subtotal</span>
              <span>{formatRs(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between font-body-dense text-body-dense">
              <span className="text-secondary">Discount</span>
              <span className="text-error">- {formatRs(totals.discount)}</span>
            </div>
            <div className="flex items-center justify-between font-body-dense text-body-dense">
              <span className="text-secondary">GST</span>
              <span>{formatRs(totals.tax)}</span>
            </div>
            <div className="flex items-center justify-between font-body-dense text-body-dense">
              <span className="text-secondary">Freight</span>
              <span>{formatRs(totals.freight)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-outline-variant pt-2">
              <span className="font-label-caps text-label-caps uppercase text-secondary">
                Grand Total
              </span>
              <span className="font-mono-data text-[18px] font-bold text-on-surface">
                {formatRs(totals.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-outline-variant pt-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded bg-surface-container px-4 font-body-medium text-body-medium text-on-surface hover:bg-surface-container-high"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-9 items-center gap-1.5 rounded bg-primary-container px-4 font-body-medium text-body-medium text-on-primary hover:bg-primary"
          >
            <span className="material-symbols-outlined text-[17px]">print</span>
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
