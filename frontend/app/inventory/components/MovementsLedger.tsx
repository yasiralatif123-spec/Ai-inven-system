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

const MOVEMENT_BADGE_CLASS: Record<MovementKind, string> = {
  purchase: "border-primary/20 bg-primary-fixed/20 text-primary",
  sale: "border-outline-variant bg-surface-container text-on-surface-variant",
  return: "border-tertiary/20 bg-tertiary-fixed/30 text-tertiary",
  writeoff: "border-error/20 bg-error-container/30 text-error",
  adjustment: "border-outline-variant bg-surface-container text-on-surface-variant",
};

const MOVEMENT_ROW_CLASS: Record<MovementKind, string> = {
  purchase: "",
  sale: "",
  return: "",
  writeoff: "bg-error-container/10",
  adjustment: "",
};

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
    <div className="overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[19px] text-primary">history_toggle_off</span>
          <div>
            <span className="font-headline-md text-headline-md text-on-surface">{title}</span>
            <span className="ml-2 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              {subtitle}
            </span>
          </div>
        </div>
        {showFilters ? (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-outline-variant/80 bg-surface-container-low p-1 font-mono-data-sm text-mono-data-sm">
            {FILTERS.map((item) => {
              const isActive = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-md px-2.5 py-1 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "border border-outline-variant bg-surface-container-lowest font-semibold text-primary shadow-panel"
                      : "text-on-surface-variant hover:bg-row-hover hover:text-on-surface"
                  }`}
                >
                  {item.label} ({counts[item.key] || 0})
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="divide-y divide-border">
        {visibleEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <span className="material-symbols-outlined text-[26px] text-outline">history</span>
            <p className="font-body-medium text-body-medium font-semibold text-on-surface">
              {entries.length === 0
                ? emptyTitle ?? "No stock movements recorded yet"
                : "No movements match this filter"}
            </p>
            <p className="font-body-default text-body-default text-on-surface-variant">
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
                className={`flex items-start justify-between gap-4 px-4 py-3.5 transition duration-200 hover:bg-surface-container-low ${MOVEMENT_ROW_CLASS[entry.kind]}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 font-mono-data-sm text-mono-data-sm font-bold ${MOVEMENT_BADGE_CLASS[entry.kind]}`}
                  >
                    <span className="material-symbols-outlined text-[13px]">{meta.icon}</span>
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
                      <span className="rounded-md border border-outline-variant bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                        {entry.sku}
                      </span>
                      <span className="font-mono-data-sm text-mono-data-sm font-semibold text-primary">
                        Ref: {entry.ref}
                      </span>
                    </div>
                    <p className="mt-0.5 font-body-default text-body-default text-on-surface-variant">
                      {entry.reason}
                    </p>
                    {entry.partyName ? (
                      <p className="mt-0.5 flex items-center gap-1 font-body-default text-body-default text-on-surface-variant">
                        <span className="material-symbols-outlined text-[14px] text-primary">
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
                    <span className="text-on-surface-variant">{entry.time}</span>
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
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition duration-200 hover:border-error/30 hover:bg-error-container/40 hover:text-error disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-movement-title"
            className="w-full max-w-md rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-panel"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[23px] text-error">delete</span>
              <div className="flex-1">
                <h3
                  id="delete-movement-title"
                  className="font-headline-md text-headline-md text-on-surface"
                >
                  Delete stock adjustment?
                </h3>
                <p className="mt-1 font-body-default text-body-default text-on-surface-variant">
                  This removes the ledger entry and reverses the stock change. This cannot be
                  undone.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-1 font-mono-data-sm text-mono-data-sm font-bold ${MOVEMENT_BADGE_CLASS[pendingDelete.kind]}`}
                >
                  {pendingDelete.qty}
                </span>
                <span className="font-body-medium text-body-medium font-semibold text-on-surface">
                  {pendingDelete.title}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono-data-sm text-mono-data-sm">
                <span className="text-on-surface-variant">SKU</span>
                <span className="text-right font-medium text-on-surface">{pendingDelete.sku}</span>
                <span className="text-on-surface-variant">Reference</span>
                <span className="text-right font-medium text-on-surface">{pendingDelete.ref}</span>
                {pendingDelete.partyName ? (
                  <>
                    <span className="text-on-surface-variant">{pendingDelete.partyLabel}</span>
                    <span className="text-right font-medium text-on-surface">
                      {pendingDelete.partyName}
                    </span>
                  </>
                ) : null}
                <span className="text-on-surface-variant">Recorded by</span>
                <span className="text-right font-medium text-on-surface">{pendingDelete.user}</span>
                <span className="text-on-surface-variant">Recorded at</span>
                <span className="text-right font-medium text-on-surface">{pendingDelete.time}</span>
              </div>
              <p className="mt-2 border-t border-outline-variant pt-2 font-body-default text-body-default text-on-surface-variant">
                {pendingDelete.reason}
              </p>
            </div>

            {deleteError ? (
              <p className="mt-3 rounded-lg border border-error/30 bg-error-container/30 px-3 py-2 font-body-default text-body-default text-error">
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
                className="h-9 rounded-lg border border-outline-variant px-4 font-body-medium text-body-medium text-on-surface transition duration-200 hover:bg-row-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deleting}
                className="h-9 rounded-lg bg-error px-4 font-body-medium text-body-medium text-on-error shadow-panel transition duration-200 hover:bg-error/90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
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
