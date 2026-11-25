"use client";

import { useEffect, useRef } from "react";
import type { PurchaseRecord } from "../purchaseData";

type PurchaseActionsMenuProps = {
  purchase: PurchaseRecord;
  open: boolean;
  onToggle: () => void;
  onAction: (action: string) => void;
};

const ACTIONS = [
  { label: "View PO", icon: "visibility", tone: "default" },
  { label: "View Receipt History", icon: "history", tone: "default" },
  { label: "Receive Goods (GRN)", icon: "input", tone: "primary" },
  { label: "Record Payment", icon: "payments", tone: "default" },
  { label: "Edit Purchase", icon: "edit", tone: "default" },
  { label: "Cancel Purchase", icon: "cancel", tone: "danger" },
  { label: "Delete Purchase", icon: "delete", tone: "danger" },
] as const;

export function PurchaseActionsMenu({
  purchase,
  open,
  onToggle,
  onAction,
}: PurchaseActionsMenuProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onToggle();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onToggle, open]);

  return (
    <div ref={wrapperRef} className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Open actions for ${purchase.id}`}
        aria-expanded={open}
        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
          open
            ? "border-outline-variant bg-surface-container-high text-on-surface"
            : "border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
        }`}
      >
        <span className="material-symbols-outlined text-[17px]">more_horiz</span>
      </button>

      {open ? (
        <div className="absolute right-3 top-10 z-[9999] w-52 rounded-xl border border-outline-variant/80 bg-surface-container-lowest py-1.5 text-left shadow-panel">
          <div className="border-b border-outline-variant/70 px-3 py-1.5 font-label-caps text-label-caps uppercase text-on-surface-variant">
            Actions · {purchase.id}
          </div>
          {ACTIONS.map((action, index) => (
            <div key={action.label}>
              {index >= ACTIONS.length - 2 ? (
                <div className="my-1 border-t border-outline-variant/70" />
              ) : null}
              <button
                type="button"
                onClick={() => onAction(action.label)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 font-body-dense text-body-dense transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                  action.tone === "danger"
                    ? "text-error hover:bg-error-container/40"
                    : action.tone === "primary"
                      ? "font-medium text-primary hover:bg-primary-container/10"
                      : "text-on-surface hover:bg-surface-container"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    action.tone === "danger"
                      ? "text-error"
                      : action.tone === "primary"
                        ? "text-primary"
                        : "text-on-surface-variant"
                  }`}
                >
                  {action.icon}
                </span>
                {action.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
