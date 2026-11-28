"use client";


import { useState } from "react";
import type { Product } from "../../../app/products/types";
import { UNIT_OPTIONS } from "../constants";
import type { PurchaseLineItem } from "../types";
import {
  calculateLineTotal,
  formatUnitPrice,
  priceUnitLabel,
} from "../utils";
import { formatStockWithPieces, toBasePieces } from "../../../app/lib/units";
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
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-mono-data text-mono-data text-on-surface text-right outline-none transition duration-200 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary";

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
    <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-lowest shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/70 bg-surface-container-low px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">
            Line Items
          </span>
          <span className="rounded-md border border-outline-variant/60 bg-surface-container-lowest px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            {committedCount} committed / {pendingCount} pending
          </span>
        </div>
        <button
          type="button"
          onClick={() => setScanOpen((current) => !current)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-body-medium text-body-medium text-primary transition duration-200 hover:bg-primary-container/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-[17px]">qr_code_scanner</span>
          <span>{scanOpen ? "Close barcode scan" : "+ Bulk scan barcode"}</span>
        </button>
      </div>

      {scanOpen ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant/70 bg-surface-container-low px-5 py-3">
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
            className="h-9 min-w-[220px] flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data text-on-surface outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={submitScan}
            className="h-9 rounded-lg bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Add item
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-11 bg-surface-container font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              <th className="min-w-[260px] py-3 pl-5 pr-3 font-medium">Product / SKU</th>
              <th className="w-28 px-3 py-3 font-medium">Qty</th>
              <th className="w-28 px-3 py-3 font-medium">Unit</th>
              <th className="w-32 px-3 py-3 text-right font-medium">Unit Price</th>
              <th className="w-28 px-3 py-3 text-right font-medium">Discount</th>
              <th className="w-36 px-4 py-3 text-right font-medium">Line Total (Rs.)</th>
              <th className="w-9 py-3 pl-1 pr-5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70 font-body-default text-body-default text-on-surface">
            {items.map((item, index) => {
              const invalidQuantity = item.quantity < 0;
              const lineTotal = calculateLineTotal(item);
              const product = products.find((candidate) => candidate._id === item.productId) || null;
                            
              return (
                <tr
                  key={item.rowId}
                  className={`transition-colors hover:bg-surface-container-low/70 ${
                    invalidQuantity ? "bg-error-container/20" : ""
                  }`}
                >
                  <td className="py-4 pl-5 pr-3">
                    <div className="flex flex-col gap-1.5">
                      <ProductPicker
                        value={item.name}
                        onChange={(value) =>
                          onItemChange(item.rowId, {
                            name: value,
                            productId: "",
                            sku: "",
                            priceBasis: "manual",
                          })
                        }
                        onProductSelect={(product) => onProductSelect(item.rowId, product)}
                        products={products}
                        loading={productsLoading}
                        emptyMessage={emptyProductsMessage}
                        ariaLabel={`Product for line ${index + 1}`}
                      />
                      <span className="font-mono-data text-mono-data text-on-surface-variant">
                        {item.sku || "Manual item - no SKU"}
                      </span>
                      {item.availableStock !== undefined && item.productId ? (
                        <span
                          className={`font-body-dense text-body-dense ${
                            item.lowStock ? "font-semibold text-error" : "text-on-surface-variant"
                          }`}
                        >
                          Available {formatStockWithPieces(item.availableStock)} · ordered {Math.max(item.quantity, 0)} {priceUnitLabel(item.unit)} · received {Math.max(item.receivedQuantity || 0, 0)} {priceUnitLabel(item.unit)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={item.quantity}
                      onChange={(event) =>
                        onItemChange(item.rowId, {
                          quantity: Math.max(Number(event.target.value) || 0, 0),
                        })
                      }
                      aria-label={`Quantity for line ${index + 1}`}
                      className={CELL_INPUT_CLASS}
                    />
                    <span className="mt-1 block font-body-dense text-body-dense text-on-surface-variant">
                      {toBasePieces(item.quantity, item.unit)} pcs
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <select
                      value={item.unit}
                      onChange={(event) => onItemChange(item.rowId, { unit: event.target.value })}
                      aria-label={`Unit for line ${index + 1}`}
                      className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 font-body-dense text-body-dense text-on-surface outline-none transition duration-200 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary"
                    >
                      {Array.from(new Set([UNIT_OPTIONS, item.unit].flat().filter(Boolean))).map(
                        (unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        )
                      )}
                    </select>
                    <span className="mt-1 block font-body-dense text-body-dense text-on-surface-variant">
                      1 {item.unit} = {toBasePieces(1, item.unit)} pcs
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    {item.productId ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono-data text-mono-data text-on-surface">
                          {formatUnitPrice(item.unitPrice, item.unit)}
                        </span>
                        <span className="font-body-dense text-body-dense text-on-surface-variant">
                          {item.priceBasis === "manual"
                            ? "Manual price"
                            : "Derived from catalog price per Piece"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) =>
                            onItemChange(item.rowId, {
                              unitPrice: Math.max(Number(event.target.value) || 0, 0),
                            })
                          }
                          aria-label={`Unit price for line ${index + 1}`}
                          className={CELL_INPUT_CLASS}
                        />
                        <span className="font-body-dense text-body-dense text-on-surface-variant">
                          / {priceUnitLabel(item.unit)} (manual)
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
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
                  <td className="px-4 py-4 text-right">
                    <span
                      className={`font-mono-data text-mono-data font-semibold ${
                        invalidQuantity ? "text-error" : "text-on-surface"
                      }`}
                    >
                      {lineTotal.toLocaleString("en-PK")}
                    </span>
                  </td>
                  <td className="py-4 pl-1 pr-5 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.rowId)}
                      aria-label={`Remove line ${index + 1}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition duration-200 hover:bg-error-container/40 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/70 bg-surface-container-low px-5 py-3.5">
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex h-9 items-center gap-2 rounded-lg px-3 font-body-medium text-body-medium text-primary transition duration-200 hover:bg-primary-container/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>+ Add another product</span>
        </button>
        <span className="font-body-dense text-body-dense text-on-surface-variant">
          Press [Tab] across cells or [Enter] to add from the product list
        </span>
      </div>
    </div>
  );
}
