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
        className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
          open
            ? "border border-outline-variant bg-surface-container-high text-on-surface"
            : "text-secondary hover:bg-surface-container hover:text-on-surface"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-8 z-[9999] flex w-40 flex-col rounded border border-outline-variant bg-surface-container-lowest py-1 text-left shadow-sm">
          <button
            type="button"
            onClick={() => onEdit(order)}
            disabled={order.status === "Cancelled"}
            className="flex items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <span className="material-symbols-outlined text-[15px] text-secondary">edit</span>
            Edit Sale
          </button>
          <button
            type="button"
            onClick={() => onCancel(order)}
            disabled={order.status === "Cancelled"}
            title={order.status === "Cancelled" ? "Order already cancelled" : "Cancel this sale order"}
            className="flex items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-error transition-colors hover:bg-[#fdf0ee] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <span className="material-symbols-outlined text-[15px] text-error">cancel</span>
            Cancel Sale
          </button>
          <button
            type="button"
            onClick={() => onDelete(order)}
            className="flex items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-error transition-colors hover:bg-[#fdf0ee]"
          >
            <span className="material-symbols-outlined text-[15px] text-error">delete</span>
            Delete Sale
          </button>
          <div className="my-1 h-px bg-outline-variant" />
          <button
            type="button"
            onClick={() => onRecordPayment(order.id)}
            disabled={!hasOutstanding || order.status === "Cancelled"}
            title={order.status === "Cancelled" ? "Cancelled orders cannot receive payments" : hasOutstanding ? undefined : "No outstanding balance"}
            className="flex items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <span className="material-symbols-outlined text-[15px] text-secondary">payments</span>
            Record Payment
          </button>
        </div>
      ) : null}
    </div>
  );
}
