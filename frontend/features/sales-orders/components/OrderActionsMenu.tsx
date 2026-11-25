"use client";

import { useEffect, useRef } from "react";
import type { SalesOrder } from "../types";

type OrderActionsMenuProps = {
  order: SalesOrder;
  open: boolean;
  onToggle: () => void;
  onEdit: (order: SalesOrder) => void;
  onDelete: (order: SalesOrder) => void;
  onCancel: (order: SalesOrder) => void;
  onRecordPayment: (id: string) => void;
};

export function OrderActionsMenu({
  order,
  open,
  onToggle,
  onEdit,
  onDelete,
  onCancel,
  onRecordPayment,
}: OrderActionsMenuProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onToggle();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onToggle();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onToggle]);

  const hasOutstanding = order.financials.outstanding > 0;

  return (
    <div
      ref={wrapperRef}
      className="relative inline-block text-left"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Actions for sale ${order.id}`}
        aria-expanded={open}
        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
          open
            ? "border-outline-variant bg-surface-container-high text-on-surface"
            : "border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">more_horiz</span>
      </button>

      {open ? (
        <div className="absolute right-2 top-10 z-50 w-48 rounded-xl border border-outline-variant/80 bg-surface-container-lowest py-1.5 text-left shadow-panel">
          <button
            type="button"
            onClick={() => onEdit(order)}
            disabled={order.status === "Cancelled"}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-body-dense text-body-dense text-on-surface transition duration-200 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              edit
            </span>
            Edit Sale
          </button>
          <button
            type="button"
            onClick={() => onCancel(order)}
            disabled={order.status === "Cancelled"}
            title={order.status === "Cancelled" ? "Order already cancelled" : "Cancel this sale order"}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-body-dense text-body-dense text-error transition duration-200 hover:bg-error-container/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px] text-error">cancel</span>
            Cancel Sale
          </button>
          <button
            type="button"
            onClick={() => onDelete(order)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-body-dense text-body-dense text-error transition duration-200 hover:bg-error-container/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[16px] text-error">delete</span>
            Delete Sale
          </button>
          <div className="my-1 border-t border-outline-variant/70" />
          <button
            type="button"
            onClick={() => onRecordPayment(order.id)}
            disabled={!hasOutstanding || order.status === "Cancelled"}
            title={order.status === "Cancelled" ? "Cancelled orders cannot receive payments" : hasOutstanding ? undefined : "No outstanding balance"}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-body-dense text-body-dense text-on-surface transition duration-200 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              payments
            </span>
            Record Payment
          </button>
        </div>
      ) : null}
    </div>
  );
}
