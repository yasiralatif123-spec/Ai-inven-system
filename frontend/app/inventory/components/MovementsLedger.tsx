"use client";

import { useMemo, useState } from "react";
import { MOVEMENT_META, type MovementEntry, type MovementKind } from "../data";

type MovementsLedgerProps = {
  entries: MovementEntry[];
  showFilters?: boolean;
  title?: string;
  subtitle?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  onDelete?: (movementId: string) => Promise<void>;
};

type MovementFilter = "all" | MovementKind;

const FILTERS: Array<{ key: MovementFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "purchase", label: "Purchases" },
  { key: "sale", label: "Sales" },
  { key: "return", label: "Returns" },
  { key: "adjustment", label: "Adjustments" },
];

export function MovementsLedger({
  entries,
  showFilters = true,
  title = "Live Stock Movements Ledger",
  subtitle = "Real-time ledger entries from barcoding & dispatch",
  emptyTitle,
  emptyMessage,
  onDelete,
}: MovementsLedgerProps) {
  const [filter, setFilter] = useState<MovementFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<MovementEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const counts = useMemo(() => {
    return entries.reduce<Record<string, number>>(
      (acc, entry) => {
        acc[entry.kind] = (acc[entry.kind] || 0) + 1;
        return acc;
      },
      { all: entries.length }
    );
  }, [entries]);

  const visibleEntries = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((entry) => entry.kind === filter);
  }, [entries, filter]);

  async function confirmDelete() {
    if (!pendingDelete || !onDelete) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete the stock adjustment."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-low px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">history_toggle_off</span>
          <div>
            <span className="font-headline-md text-headline-md text-on-surface">{title}</span>
            <span className="ml-2 font-mono-data-sm text-mono-data-sm text-secondary">
              {subtitle}
            </span>
          </div>
        </div>
        {showFilters ? (
          <div className="flex flex-wrap items-center gap-1 font-mono-data text-[11px]">
            {FILTERS.map((item) => {
              const isActive = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded px-2 py-0.5 transition-colors ${
                    isActive
                      ? "border border-outline-variant bg-surface-container-highest font-bold text-primary"
                      : "text-secondary hover:bg-surface-container"
                  }`}
                >
                  {item.label} ({counts[item.key] || 0})
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="divide-y divide-outline-variant">
        {visibleEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 px-4 py-8 text-center">
            <span className="material-symbols-outlined text-[24px] text-outline">history</span>
            <p className="font-body-medium text-body-medium font-semibold text-on-surface">
              {entries.length === 0
                ? emptyTitle ?? "No stock movements recorded yet"
                : "No movements match this filter"}
            </p>
            <p className="font-body-dense text-body-dense text-secondary">
              {entries.length === 0
                ? emptyMessage ??
                  "Adjust stock from the panel to create the first audited ledger entry."
                : "Choose another category to view the recorded movements."}
            </p>
          </div>
        ) : (
          visibleEntries.map((entry) => {
            const meta = MOVEMENT_META[entry.kind];
            return (
              <div
                key={entry.id}
                className={`flex items-start justify-between px-4 py-3 transition-colors hover:bg-surface-container-low ${meta.rowClass || ""}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex items-center gap-1 whitespace-nowrap rounded border px-2 py-0.5 font-mono-data-sm text-mono-data-sm font-bold ${meta.badgeClass}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">{meta.icon}</span>
                    {entry.qty}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-body-medium text-body-medium font-semibold ${
                          meta.titleClass || "text-on-surface"
                        }`}
                      >
                        {entry.title}
                      </span>
                      <span className="rounded border border-outline-variant bg-surface-container px-1 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
                        {entry.sku}
                      </span>
                      <span className="font-mono-data-sm text-mono-data-sm font-semibold text-primary">
                        Ref: {entry.ref}
                      </span>
                    </div>
                    <p className="mt-0.5 font-body-dense text-body-dense text-secondary">
                      {entry.reason}
                    </p>
                    {entry.partyName ? (
                      <p className="mt-0.5 flex items-center gap-1 font-body-dense text-body-dense text-secondary">
                        <span className="material-symbols-outlined text-[13px] text-primary">
                          {entry.kind === "purchase" ? "local_shipping" : "person"}
                        </span>
                        <span className="font-medium text-on-surface">{entry.partyLabel}:</span>{" "}
                        {entry.partyName}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex flex-col text-right font-mono-data-sm text-mono-data-sm">
                    <span className="font-medium text-on-surface">{entry.user}</span>
                    <span className="text-secondary">{entry.time}</span>
                  </div>
                  {onDelete && entry.kind === "adjustment" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDelete(entry);
                      }}
                      disabled={deleting}
                      aria-label={`Delete stock adjustment for ${entry.sku}`}
                      title="Delete stock adjustment"
                      className="flex h-7 w-7 items-center justify-center rounded border border-outline-variant text-secondary transition-colors hover:bg-error-container hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-movement-title"
            className="w-full max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[22px] text-error">delete</span>
              <div className="flex-1">
                <h3
                  id="delete-movement-title"
                  className="font-headline-md text-headline-md text-on-surface"
                >
                  Delete stock adjustment?
                </h3>
                <p className="mt-1 font-body-dense text-body-dense text-secondary">
                  This removes the ledger entry and reverses the stock change. This cannot be
                  undone.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded border border-outline-variant bg-surface-container p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded border px-2 py-0.5 font-mono-data-sm text-mono-data-sm font-bold ${MOVEMENT_META[pendingDelete.kind].badgeClass}`}
                >
                  {pendingDelete.qty}
                </span>
                <span className="font-body-medium text-body-medium font-semibold text-on-surface">
                  {pendingDelete.title}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono-data-sm text-mono-data-sm">
                <span className="text-secondary">SKU</span>
                <span className="text-right font-medium text-on-surface">{pendingDelete.sku}</span>
                <span className="text-secondary">Reference</span>
                <span className="text-right font-medium text-on-surface">{pendingDelete.ref}</span>
                {pendingDelete.partyName ? (
                  <>
                    <span className="text-secondary">{pendingDelete.partyLabel}</span>
                    <span className="text-right font-medium text-on-surface">
                      {pendingDelete.partyName}
                    </span>
                  </>
                ) : null}
                <span className="text-secondary">Recorded by</span>
                <span className="text-right font-medium text-on-surface">{pendingDelete.user}</span>
                <span className="text-secondary">Recorded at</span>
                <span className="text-right font-medium text-on-surface">{pendingDelete.time}</span>
              </div>
              <p className="mt-2 border-t border-outline-variant pt-2 font-body-dense text-body-dense text-secondary">
                {pendingDelete.reason}
              </p>
            </div>

            {deleteError ? (
              <p className="mt-3 rounded border border-error-container bg-error-container/40 px-2.5 py-2 font-body-dense text-body-dense text-error">
                {deleteError}
              </p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(null);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="h-[34px] rounded border border-outline-variant px-4 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deleting}
                className="h-[34px] rounded bg-error px-4 font-body-medium text-body-medium text-on-error transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Adjustment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
