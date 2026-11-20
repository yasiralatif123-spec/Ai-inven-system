"use client";

import type { Supplier } from "../../suppliers/types";
import { SupplierAutocomplete } from "./SupplierAutocomplete";
import { DateTextInput } from "./DateTextInput";
import { formatRs, paymentTermsLabel } from "../utils";

type PurchaseContextCardProps = {
  supplierQuery: string;
  onSupplierQueryChange: (value: string) => void;
  onSupplierSelect: (supplier: Supplier) => void;
  selectedSupplier: Supplier | null;
  suppliers: Supplier[];
  suppliersLoading: boolean;
  supplierError: string | null;
  purchaseDate: string;
  onPurchaseDateChange: (value: string) => void;
  expectedDelivery: string;
  onExpectedDeliveryChange: (value: string) => void;
  invoiceNumber: string;
  onInvoiceNumberChange: (value: string) => void;
};

export function PurchaseContextCard({
  supplierQuery,
  onSupplierQueryChange,
  onSupplierSelect,
  selectedSupplier,
  suppliers,
  suppliersLoading,
  supplierError,
  purchaseDate,
  onPurchaseDateChange,
  expectedDelivery,
  onExpectedDeliveryChange,
  invoiceNumber,
  onInvoiceNumberChange,
}: PurchaseContextCardProps) {
  return (
    <div className="flex flex-col gap-3.5 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
          Order Context &amp; Logistics
        </span>
        <span className="font-mono-data-sm text-mono-data-sm text-outline">
          Terminal ID #WH-KHI-01
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
          <SupplierAutocomplete
            value={supplierQuery}
            onChange={onSupplierQueryChange}
            onSelect={onSupplierSelect}
            suppliers={suppliers}
            loading={suppliersLoading}
            error={supplierError}
          />
        </div>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="font-label-caps text-label-caps text-on-surface">Purchase Date</span>
          <DateTextInput
            value={purchaseDate}
            onChange={onPurchaseDateChange}
            ariaLabel="Purchase date"
          />
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="font-label-caps text-label-caps text-on-surface">
            Expected Delivery
          </span>
          <DateTextInput
            value={expectedDelivery}
            onChange={onExpectedDeliveryChange}
            ariaLabel="Expected delivery date"
          />
        </label>

        <label className="flex flex-col gap-1 md:col-span-3">
          <span className="font-label-caps text-label-caps text-on-surface">
            Supplier Invoice # <span className="font-normal font-mono-data-sm text-secondary">(Opt)</span>
          </span>
          <input
            value={invoiceNumber}
            onChange={(event) => onInvoiceNumberChange(event.target.value)}
            placeholder="e.g. INV-KBD-904"
            className="h-10 w-full rounded bg-surface-container-lowest px-3 font-mono-data text-mono-data text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
          />
        </label>
      </div>

      {selectedSupplier ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-surface-container px-3 py-2 font-mono-data-sm text-mono-data-sm text-secondary">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-body-dense text-body-dense text-on-surface">
              Auto-filled from supplier
            </span>
            <span>{selectedSupplier.contact}</span>
            <span>{selectedSupplier.phone}</span>
            <span>{selectedSupplier.hub || selectedSupplier.region}</span>
            <span>{paymentTermsLabel(selectedSupplier.paymentTerms)}</span>
          </span>
          <span className="font-medium text-tertiary">
            Ledger due {formatRs(selectedSupplier.outstanding)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
