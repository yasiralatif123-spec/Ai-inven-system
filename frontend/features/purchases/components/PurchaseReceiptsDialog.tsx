"use client";

import type { PurchaseDto } from "../types";
import { formatDate } from "../utils";

type PurchaseReceiptsDialogProps = {
  purchase: PurchaseDto | null;
  onClose: () => void;
};

export function PurchaseReceiptsDialog({ purchase, onClose }: PurchaseReceiptsDialogProps) {
  if (!purchase) return null;

  const receipts = purchase.items.flatMap((item, itemIndex) =>
    (item.receipts || []).map((receipt, receiptIndex) => ({
      ...receipt,
      itemName: item.name,
      key: `${item.id || itemIndex}-${receiptIndex}`,
    }))
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded bg-surface-container-lowest shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div>
            <p className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              Goods Receipt Ledger
            </p>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {purchase.purchaseNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt history"
            className="flex h-7 w-7 items-center justify-center rounded text-secondary transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {receipts.length === 0 ? (
            <p className="py-8 text-center font-body-dense text-body-dense text-secondary">
              No goods have been received against this purchase yet.
            </p>
          ) : (
            <div className="space-y-3">
              {receipts.map((receipt) => (
                <div
                  key={receipt.key}
                  className="rounded border border-outline-variant bg-surface-container-low p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-body-medium text-body-medium text-on-surface">
                        {receipt.itemName}
                      </div>
                      <div className="font-mono-data-sm text-mono-data-sm text-secondary">
                        {receipt.reference || "GRN"} · {formatDate(receipt.receivedAt)} ·{" "}
                        {receipt.performedBy}
                      </div>
                    </div>
                    <span className="rounded bg-primary-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-on-primary-container">
                      +{receipt.quantity} units
                    </span>
                  </div>
                  <div className="mt-2 font-mono-data-sm text-mono-data-sm text-secondary">
                    Cumulative received after this receipt: {receipt.receivedQuantity}
                  </div>
                  {receipt.notes ? (
                    <p className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
                      {receipt.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-outline-variant px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded border border-outline-variant bg-surface px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
