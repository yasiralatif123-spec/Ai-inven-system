"use client";

type CreatePurchaseHeaderProps = {
  purchaseCode: string;
  saving: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  onSaveDraft: () => void;
  onSavePurchase: () => void;
};

export function CreatePurchaseHeader({
  purchaseCode,
  saving,
  mode,
  onCancel,
  onSaveDraft,
  onSavePurchase,
}: CreatePurchaseHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
          <span>Purchases</span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface">
            {mode === "edit" ? "Edit Purchase" : "Create Purchase"}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
            {mode === "edit" ? "Edit Purchase" : "New Purchase"}
          </h1>
          <div className="inline-flex items-center rounded bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant font-medium">
            {purchaseCode}{" "}
            <span className="ml-1 text-secondary">
              ({mode === "edit" ? "Edit Mode" : "Draft Mode"})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-2 py-1.5 font-body-default text-body-default text-secondary transition-colors hover:text-on-surface disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={saving}
          className="h-9 rounded bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save as Draft"}
        </button>
        <button
          type="button"
          onClick={onSavePurchase}
          disabled={saving}
          className="flex h-9 items-center gap-1.5 rounded bg-primary-container px-4 font-body-medium text-body-medium text-on-primary shadow-sm transition-colors hover:bg-primary disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[17px]">check</span>
          <span>{saving ? "Saving…" : "Save Purchase"}</span>
        </button>
      </div>
    </div>
  );
}
