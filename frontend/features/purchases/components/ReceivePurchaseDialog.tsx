"use client";

import { useMemo, useState } from "react";
import type { PurchaseDto, PurchaseReceiveInput } from "../types";
import { formatUnitPrice, itemRemainingQuantity } from "../utils";

type ReceivePurchaseDialogProps = {
  purchase: PurchaseDto | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (purchase: PurchaseDto, payload: PurchaseReceiveInput) => void;
};

type ReceivedValues = Record<string, number>;

function itemKey(item: PurchaseDto["items"][number], index: number): string {
  return item.id || `index:${index}`;
}

function initialValues(purchase: PurchaseDto | null): ReceivedValues {
  const values: ReceivedValues = {};
  if (purchase) {
    purchase.items.forEach((item, index) => {
      values[itemKey(item, index)] = Number(item.receivedQuantity) || 0;
    });
  }
  return values;
}

export function ReceivePurchaseDialog({
  purchase,
  saving,
  onClose,
  onConfirm,
}: ReceivePurchaseDialogProps) {
  const [values, setValues] = useState<ReceivedValues>(() => initialValues(purchase));
  const [reference, setReference] = useState(() =>
    purchase ? `GRN-${purchase.purchaseNumber}` : "GRN"
  );
  const [notes, setNotes] = useState("");

  const totals = useMemo(() => {
    if (!purchase) return { ordered: 0, previous: 0, entered: 0 };

    let ordered = 0;
    let previous = 0;
    let entered = 0;

    purchase.items.forEach((item, index) => {
      const key = itemKey(item, index);
      ordered += Number(item.quantity) || 0;
      previous += Number(item.receivedQuantity) || 0;
      entered += Math.max(0, Number(values[key]) || 0);
    });

    return { ordered, previous, entered };
  }, [purchase, values]);

  if (!purchase) return null;

  const hasErrors = purchase.items.some((item, index) => {
    const value = values[itemKey(item, index)];
    const previous = Number(item.receivedQuantity) || 0;
    return (
      !Number.isFinite(value) ||
      !Number.isInteger(value) ||
      value < previous ||
      value > Number(item.quantity)
    );
  });
  const hasChanges = totals.entered > totals.previous;

  function updateValue(key: string, rawValue: string) {
    const parsed = rawValue === "" ? 0 : Number(rawValue);
    setValues((current) => ({
      ...current,
      [key]: Number.isFinite(parsed) ? Math.floor(parsed) : 0,
    }));
  }

  function receiveAll() {
    const next: ReceivedValues = {};
    purchase!.items.forEach((item, index) => {
      next[itemKey(item, index)] = Number(item.quantity) || 0;
    });
    setValues(next);
  }

  function handleSubmit() {
    if (hasErrors || !hasChanges || saving) return;

    const payload: PurchaseReceiveInput = {
      reference: reference.trim() || "GRN",
      notes: notes.trim(),
      items: purchase!.items.map((item, index) => {
        const key = itemKey(item, index);
        return item.id
          ? { itemId: item.id, receivedQuantity: values[key] || 0 }
          : { itemIndex: index, receivedQuantity: values[key] || 0 };
      }),
    };

    onConfirm(purchase!, payload);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-overlay/40 p-4 sm:p-8">
      <div className="w-full max-w-4xl rounded bg-surface-container-lowest shadow-2xl">
        <div className="flex items-start justify-between border-b border-outline-variant px-4 py-3">
          <div>
            <p className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Goods Receipt Note
            </p>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Receive Goods · {purchase.purchaseNumber}
              </h2>
              <span className="rounded bg-secondary-container px-2 py-0.5 font-label-caps text-label-caps uppercase text-on-secondary-container">
                {purchase.status}
              </span>
            </div>
            <p className="mt-1 font-body-dense text-body-dense text-secondary">
              {purchase.supplier.name} · {purchase.invoiceNumber || "No supplier invoice"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receive goods dialog"
            className="flex h-8 w-8 items-center justify-center rounded text-outline transition-colors hover:bg-row-hover hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-4">
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 font-body-dense text-body-dense text-secondary">
              GRN Reference
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="h-9 rounded border border-outline-variant bg-surface px-2 font-mono-data-sm text-mono-data-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 font-body-dense text-body-dense text-secondary sm:col-span-2">
              Receipt Notes
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Short delivery, damaged cartons, etc."
                className="h-9 rounded border border-outline-variant bg-surface px-2 font-body-dense text-body-dense text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <div className="overflow-x-auto rounded border border-outline-variant">
            <table className="w-full border-collapse text-left font-body-dense text-body-dense">
              <thead className="bg-surface-container font-label-caps text-label-caps uppercase text-secondary">
                <tr>
                  <th className="px-3 py-2">Product / SKU</th>
                  <th className="px-3 py-2 text-right">Ordered</th>
                  <th className="px-3 py-2 text-right">Already Received</th>
                  <th className="px-3 py-2 text-right">Remaining</th>
                  <th className="px-3 py-2 text-right">Purchase Price</th>
                  <th className="w-40 px-3 py-2 text-right">Received Qty (Total)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchase.items.map((item, index) => {
                  const key = itemKey(item, index);
                  const ordered = Number(item.quantity) || 0;
                  const previous = Number(item.receivedQuantity) || 0;
                  const remaining = itemRemainingQuantity(item);
                  const value = values[key] ?? previous;
                  const invalid =
                    !Number.isInteger(value) || value < previous || value > ordered;

                  return (
                    <tr key={key}>
                      <td className="px-3 py-2">
                        <span className="block font-body-medium text-body-medium text-on-surface">
                          {item.name}
                        </span>
                        <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                          {item.sku || "Manual item"}
                          
                          {item.productId ? "" : " · no linked product"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono-data">{ordered}</td>
                      <td className="px-3 py-2 text-right font-mono-data text-primary">
                        {previous}
                      </td>
                      <td className="px-3 py-2 text-right font-mono-data">{remaining}</td>
                      <td className="px-3 py-2 text-right font-mono-data">
                        {formatUnitPrice(item.unitPrice, item.unit)}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={previous}
                          max={ordered}
                          step={1}
                          value={value}
                          onChange={(event) => updateValue(key, event.target.value)}
                          aria-label={`Received quantity for ${item.name}`}
                          className={`h-9 w-full rounded border bg-surface px-2 text-right font-mono-data tabular-nums text-on-surface focus:outline-none ${
                            invalid
                              ? "border-error focus:border-error"
                              : "border-outline-variant focus:border-primary"
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded bg-surface-container p-3 font-body-dense text-body-dense">
            <div className="flex flex-wrap gap-4">
              <span className="text-secondary">
                Ordered: <span className="font-mono-data text-on-surface">{totals.ordered}</span>
              </span>
              <span className="text-secondary">
                Previously received:{" "}
                <span className="font-mono-data text-primary">{totals.previous}</span>
              </span>
              <span className="text-secondary">
                Entered total:{" "}
                <span className="font-mono-data text-on-surface">{totals.entered}</span>
              </span>
              <span className="text-secondary">
                New stock:{" "}
                <span className="font-mono-data text-primary">
                  +{Math.max(totals.entered - totals.previous, 0)}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={receiveAll}
              disabled={saving}
              className="h-8 rounded border border-outline-variant bg-surface px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-row-hover disabled:opacity-50"
            >
              Receive all remaining
            </button>
          </div>

          {hasErrors ? (
            <p className="mt-3 font-body-dense text-body-dense text-error">
              Enter a whole number between the already received quantity and the ordered quantity
              for every item.
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-outline-variant bg-surface-container-high/40 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-8 rounded border border-outline-variant bg-surface px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-row-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={hasErrors || !hasChanges || saving}
            className="h-8 rounded bg-primary px-4 font-body-medium text-body-medium text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Receiving…" : "Confirm Receipt"}
          </button>
        </div>
      </div>
    </div>
  );
}
