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
        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
          highlighted
            ? "border border-outline-variant bg-surface-container-high text-on-surface"
            : "text-on-surface-variant hover:border border-outline-variant/70 hover:bg-surface-container hover:text-on-surface"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-9 z-[9999] w-48 rounded-lg border border-outline-variant/80 bg-surface-container-lowest py-1.5 text-left shadow-panel">
          <div className="border-b border-outline-variant/80 px-3 py-1.5 font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant">
            Actions: {supplier.name.split(" ").slice(0, 2).join(" ")}
          </div>
          <button
            type="button"
            onClick={() => onOpenProfile(supplier)}
            className="flex w-full items-center gap-2.5 px-3 py-2 font-body-default text-body-default text-on-surface transition duration-200 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
            Open Profile
          </button>
          <button
            type="button"
            onClick={() => onCreatePurchase(supplier)}
            className="flex w-full items-center gap-2.5 px-3 py-2 font-body-default text-body-default text-on-surface transition duration-200 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              add_shopping_cart
            </span>
            Create Purchase
          </button>
          <button
            type="button"
            onClick={() => onRecordPayment(supplier)}
            className="flex w-full items-center gap-2.5 px-3 py-2 font-body-default text-body-default text-on-surface transition duration-200 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              receipt_long
            </span>
            Record Payment
          </button>
          <div className="my-1 h-px bg-outline-variant/80" />
          <button
            type="button"
            onClick={() => onEdit(supplier)}
            className="flex w-full items-center gap-2.5 px-3 py-2 font-body-default text-body-default text-on-surface transition duration-200 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit</span>
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(supplier)}
            className="flex w-full items-center gap-2.5 px-3 py-2 font-body-default text-body-default text-error transition duration-200 hover:bg-error-container/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
          >
            <span className="material-symbols-outlined text-[16px] text-error">delete</span>
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
