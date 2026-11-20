"use client";

import { useEffect, useRef } from "react";
import type { Supplier } from "../types";

type SupplierActionsMenuProps = {
  supplier: Supplier;
  open: boolean;
  highlighted?: boolean;
  onToggle: () => void;
  onOpenProfile: (supplier: Supplier) => void;
  onCreatePurchase: (supplier: Supplier) => void;
  onRecordPayment: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
};

export function SupplierActionsMenu({
  supplier,
  open,
  highlighted = false,
  onToggle,
  onOpenProfile,
  onCreatePurchase,
  onRecordPayment,
  onEdit,
  onDelete,
}: SupplierActionsMenuProps) {
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
  }, [open, onToggle]);

  return (
    <div ref={wrapperRef} className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Actions for ${supplier.name}`}
        aria-expanded={open}
        className={`mx-auto flex h-7 w-7 items-center justify-center rounded transition-colors ${
          highlighted
            ? "bg-surface-container-high text-on-surface"
            : "text-secondary hover:bg-surface-container-high hover:text-on-surface"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>

      {open ? (
        <div className="absolute right-8 top-2 z-[9999] w-44 rounded bg-surface-container-lowest py-1 text-left shadow-md">
          <div className="border-b border-surface-container px-3 py-1 font-label-caps text-[10px] uppercase tracking-wider text-secondary">
            Actions: {supplier.name.split(" ").slice(0, 2).join(" ")}
          </div>
          <button
            type="button"
            onClick={() => onOpenProfile(supplier)}
            className="flex w-full items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">person</span>
            Open Profile
          </button>
          <button
            type="button"
            onClick={() => onCreatePurchase(supplier)}
            className="flex w-full items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              add_shopping_cart
            </span>
            Create Purchase
          </button>
          <button
            type="button"
            onClick={() => onRecordPayment(supplier)}
            className="flex w-full items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              receipt_long
            </span>
            Record Payment
          </button>
          <div className="my-1 h-px bg-surface-container"></div>
          <button
            type="button"
            onClick={() => onEdit(supplier)}
            className="flex w-full items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">edit</span>
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(supplier)}
            className="flex w-full items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-error transition-colors hover:bg-error-container/40"
          >
            <span className="material-symbols-outlined text-[16px] text-error">delete</span>
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
