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
    <div className="flex flex-col gap-5 pb-1">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-outline-variant/80 pb-4 text-body-dense text-on-surface-variant">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body-default text-body-default text-on-surface-variant">
            Wholesale Operations
          </span>
          <span className="text-outline-variant">/</span>
          <span className="font-body-default text-body-default text-on-surface-variant">
            Purchases
          </span>
          <span className="text-outline-variant">/</span>
          <span className="font-mono-data-sm font-medium text-primary">
            PO Directory · Active Ledger FY 2026-27
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <span>NTN: 4120938-1</span>
          <span className="text-outline-variant">|</span>
          <span>Karachi Central Warehouse (WH-01)</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-1 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
            Purchases
          </h1>
          <span className="rounded-md border border-outline-variant bg-surface-container px-2.5 py-1 font-label-caps text-label-caps uppercase text-on-surface-variant">
            Procurement Ledger
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            {recordedCount} Recorded Entries
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onExport}
            className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
              file_download
            </span>
            Export CSV
          </button>
          <button
            type="button"
            onClick={onUpload}
            className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[17px] text-primary">
              document_scanner
            </span>
            Upload Supplier Invoice
            <span className="rounded-md bg-secondary-container px-2 py-0.5 font-label-caps text-label-caps uppercase text-on-secondary-container">
              OCR AI
            </span>
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary-container px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary active:translate-y-px active:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Purchase
          </button>
        </div>
      </div>
    </div>
  );
}
