"use client";

type PurchasesHeaderProps = {
  recordedCount: number;
  onExport: () => void;
  onUpload: () => void;
  onCreate: () => void;
};

export function PurchasesHeader({
  recordedCount,
  onExport,
  onUpload,
  onCreate,
}: PurchasesHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant pb-3 text-body-dense text-secondary">
        <div className="flex items-center gap-2">
          <span className="font-body-default text-on-surface-variant">Wholesale Operations</span>
          <span className="text-outline-variant">/</span>
          <span className="font-body-default text-on-surface-variant">Purchases</span>
          <span className="text-outline-variant">/</span>
          <span className="font-mono-data-sm font-medium text-primary">
            PO Directory · Active Ledger FY 2026-27
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono-data-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <span>NTN: 4120938-1</span>
          <span className="text-outline-variant">|</span>
          <span>Karachi Central Warehouse (WH-01)</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
            Purchases
          </h1>
          <span className="rounded border border-outline-variant bg-surface-container-highest px-2 py-0.5 font-label-caps text-label-caps uppercase text-on-surface-variant">
            Procurement Ledger
          </span>
          <span className="font-mono-data-sm text-secondary">
            {recordedCount} Recorded Entries
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            className="flex h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[17px] text-secondary">file_download</span>
            Export CSV
          </button>
          <button
            type="button"
            onClick={onUpload}
            className="flex h-[34px] items-center gap-2 rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[17px] text-primary">
              document_scanner
            </span>
            Upload Supplier Invoice
            <span className="rounded bg-secondary-container px-1.5 py-0.5 font-mono-data-sm text-[10px] uppercase text-on-secondary-container">
              OCR AI
            </span>
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="flex h-[34px] items-center gap-1.5 rounded border border-transparent bg-primary-container px-3.5 font-body-medium text-body-medium text-on-primary transition-colors hover:bg-primary"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Purchase
          </button>
        </div>
      </div>
    </div>
  );
}
