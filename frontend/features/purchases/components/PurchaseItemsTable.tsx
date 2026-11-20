"use client";

import { useState } from "react";
import { FlavorMultiSelect } from "../../../app/components/FlavorMultiSelect";
import { toFlavorArray } from "../../../app/lib/flavors";
import type { Product } from "../../../app/products/types";
import { UNIT_OPTIONS } from "../constants";
import type { PurchaseLineItem } from "../types";
import { calculateLineTax, calculateLineTotal } from "../utils";
import { ProductPicker } from "./ProductPicker";

type PurchaseItemsTableProps = {
  items: PurchaseLineItem[];
  products: Product[];
  productsLoading: boolean;
  emptyProductsMessage?: string;
  onItemChange: (rowId: string, patch: Partial<PurchaseLineItem>) => void;
  onProductSelect: (rowId: string, product: Product) => void;
  onRemoveItem: (rowId: string) => void;
  onAddItem: () => void;
  onBarcodeScan: (code: string) => void;
};

const CELL_INPUT_CLASS =
  "h-8 w-full rounded bg-surface-container-lowest px-2 font-mono-data text-mono-data text-on-surface text-right outline-none focus:ring-1 focus:ring-primary-container";

export function PurchaseItemsTable({
  items,
  products,
  productsLoading,
  emptyProductsMessage,
  onItemChange,
  onProductSelect,
  onRemoveItem,
  onAddItem,
  onBarcodeScan,
}: PurchaseItemsTableProps) {
  const [scanOpen, setScanOpen] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const pendingCount = items.filter((item) => !item.productId).length;
  const committedCount = items.length - pendingCount;

  function submitScan() {
    const code = scanValue.trim();
    if (!code) return;
    onBarcodeScan(code);
    setScanValue("");
    setScanOpen(false);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="flex items-center justify-between bg-surface-container-high px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">
            Line Items
          </span>
          <span className="rounded bg-surface-container-highest px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface">
            {committedCount} committed / {pendingCount} pending
          </span>
        </div>
        <button
          type="button"
          onClick={() => setScanOpen((current) => !current)}
          className="flex items-center gap-1 font-body-dense text-body-dense font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
          <span>{scanOpen ? "Close barcode scan" : "+ Bulk scan barcode"}</span>
        </button>
      </div>

      {scanOpen ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant bg-surface-container-low px-4 py-2">
          <input
            value={scanValue}
            onChange={(event) => setScanValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitScan();
              }
            }}
            placeholder="Scan or type SKU / barcode"
            aria-label="Barcode or SKU"
            className="h-8 min-w-[220px] flex-1 rounded bg-surface-container-lowest px-2 font-mono-data text-mono-data text-on-surface outline-none focus:ring-1 focus:ring-primary-container"
          />
          <button
            type="button"
            onClick={submitScan}
            className="h-8 rounded bg-primary-container px-3 font-body-dense text-body-dense text-on-primary hover:bg-primary"
          >
            Add item
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              <th className="min-w-[240px] py-2.5 pl-4 pr-2 font-medium">Product / SKU</th>
              <th className="w-36 px-2 py-2.5 font-medium">Flavor</th>
              <th className="w-28 px-2 py-2.5 font-medium">Quantity (Target)</th>
              <th className="w-28 px-2 py-2.5 font-medium">Unit</th>
              <th className="w-32 px-2 py-2.5 text-right font-medium">Unit Price (Rs.)</th>
              <th className="w-28 px-2 py-2.5 text-right font-medium">Discount</th>
              <th className="w-32 px-2 py-2.5 font-medium">Tax (GST)</th>
              <th className="w-36 px-3 py-2.5 text-right font-medium">Line Total (Rs.)</th>
              <th className="w-8 py-2.5 pl-1 pr-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container font-body-default text-body-default text-on-surface">
            {items.map((item, index) => {
              const invalidQuantity = item.quantity < 0;
              const lineTax = calculateLineTax(item);
              const lineTotal = calculateLineTotal(item);
              const product = products.find((candidate) => candidate._id === item.productId) || null;
              const flavorOptions = [...(product?.flavors || [])];
              const savedFlavors = toFlavorArray(item.flavor);

              return (
                <tr
                  key={item.rowId}
                  className={`transition-colors hover:bg-surface-container-low ${
                    invalidQuantity ? "bg-error-container/20" : ""
                  }`}
                >
                  <td className="py-2.5 pl-4 pr-2">
                    <div className="flex flex-col gap-1">
                      <ProductPicker
                        value={item.name}
                        onChange={(value) =>
                          onItemChange(item.rowId, {
                            name: value,
                            productId: "",
                            sku: "",
                            flavor: [],
                          })
                        }
                        onProductSelect={(product) => onProductSelect(item.rowId, product)}
                        products={products}
                        loading={productsLoading}
                        emptyMessage={emptyProductsMessage}
                        ariaLabel={`Product for line ${index + 1}`}
                      />
                      <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                        {item.sku || "Manual item · no SKU"}
                      </span>
                      {item.availableStock !== undefined && item.productId ? (
                        <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                          Available {item.availableStock} · ordered {Math.max(item.quantity, 0)} ·
                          received {Math.max(item.receivedQuantity || 0, 0)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    {flavorOptions.length > 0 || savedFlavors.length > 0 ? (
                      <FlavorMultiSelect
                        options={flavorOptions}
                        value={savedFlavors}
                        onChange={(flavors) => onItemChange(item.rowId, { flavor: flavors })}
                        ariaLabel={`Flavors for line ${index + 1}`}
                        compact
                      />
                    ) : (
                      <span className="font-body-dense text-body-dense text-outline">—</span>
                    )}
                  </td>
                  <td className="relative px-2 py-2.5">
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(event) =>
                        onItemChange(item.rowId, {
                          quantity: Math.max(Number(event.target.value) || 0, 0),
                        })
                      }
                      aria-label={`Quantity for line ${index + 1}`}
                      className={`${CELL_INPUT_CLASS} text-right ${
                        invalidQuantity ? "text-error ring-2 ring-error outline-none" : ""
                      }`}
                    />
                    {invalidQuantity ? (
                      <span className="mt-0.5 block whitespace-nowrap font-body-dense text-[10px] leading-tight text-error">
                        Enter a quantity greater than 0
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5">
                    <select
                      value={item.unit}
                      onChange={(event) => onItemChange(item.rowId, { unit: event.target.value })}
                      aria-label={`Unit for line ${index + 1}`}
                      className="h-8 w-full rounded bg-surface-container-lowest px-2 font-body-dense text-body-dense text-on-surface outline-none focus:ring-1 focus:ring-primary-container"
                    >
                      {Array.from(new Set([item.unit, ...UNIT_OPTIONS].filter(Boolean))).map(
                        (unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                  <td className="px-2 py-2.5">
                    {item.productId ? (
                      <div className="flex flex-col items-end">
                        <span className="font-mono-data text-mono-data text-on-surface">
                          {item.unitPrice.toLocaleString("en-PK")}
                        </span>
                        <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                          {Number(item.basePrice) || 0} × {Number(item.flavorCount) || 1} flavor
                          {(Number(item.flavorCount) || 1) === 1 ? "" : "s"}
                        </span>
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={item.unitPrice}
                        onChange={(event) =>
                          onItemChange(item.rowId, {
                            unitPrice: Math.max(Number(event.target.value) || 0, 0),
                          })
                        }
                        aria-label={`Unit price for line ${index + 1}`}
                        className={CELL_INPUT_CLASS}
                      />
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={item.discount}
                      onChange={(event) =>
                        onItemChange(item.rowId, {
                          discount: Math.max(Number(event.target.value) || 0, 0),
                        })
                      }
                      aria-label={`Discount for line ${index + 1}`}
                      className={CELL_INPUT_CLASS}
                    />
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex flex-col">
                      <span className="font-mono-data text-mono-data leading-tight text-on-surface">
                        {item.taxRate}% GST
                      </span>
                      <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                        Rs. {lineTax.toLocaleString("en-PK")}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={`font-mono-data font-semibold ${
                        invalidQuantity ? "text-error" : "text-on-surface"
                      }`}
                    >
                      {lineTotal.toLocaleString("en-PK")}
                    </span>
                  </td>
                  <td className="py-2.5 pl-1 pr-4 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.rowId)}
                      aria-label={`Remove line ${index + 1}`}
                      className="flex h-6 w-6 items-center justify-center text-outline transition-colors hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-low px-4 py-3">
        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1.5 font-body-medium text-body-medium text-primary transition-colors hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>+ Add another product</span>
        </button>
        <span className="font-mono-data-sm text-mono-data-sm text-secondary">
          Press [Tab] across cells or [Enter] to add from the product list
        </span>
      </div>
    </div>
  );
}
