"use client";

import { useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "../../lib/api";
import type { Product } from "../types";
import {
  formatDate,
  formatPricePerPiece,
  getMargin,
  getStatus,
  getStockMeta,
} from "../product-utils";

type ProductDetailModalProps = {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDeleted: (id: string) => void;
};

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span className={`break-words text-on-surface ${mono ? "font-mono-data-sm text-mono-data-sm" : "font-body-default text-body-default"}`}>
        {value}
      </span>
    </div>
  );
}

function Flag({ active, label }: { active?: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-label-caps text-label-caps ${
        active
          ? "border-primary/20 bg-primary-fixed/30 text-primary"
          : "border-outline-variant bg-surface-container text-on-surface-variant"
      }`}
    >
      <span className="material-symbols-outlined text-[13px]">{active ? "check_circle" : "remove"}</span>
      {label}
    </span>
  );
}

export function ProductDetailModal({ product, onClose, onEdit, onDeleted }: ProductDetailModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [product, onClose, deleting]);

  if (!product) return null;

  async function handleDelete() {
    if (!product) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(`/api/products/${product._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to delete product");
      onDeleted(product._id);
    } catch (error: unknown) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete product");
      setDeleting(false);
    }
  }

  const status = getStatus(product);
  const stock = getStockMeta(product);
  const margin = getMargin(product);
  const stockValue = Number(product.openingStock || 0);
  const reorderValue = Number(product.reorderThreshold || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close product details"
        className="absolute inset-0 cursor-default bg-inverse-surface/50 backdrop-blur-[2px]"
        onClick={() => {
          if (!deleting) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${product.title}`}
        className="relative z-10 flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel"
      >
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-outline-variant bg-surface-container-low px-5 py-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[26px] text-on-surface-variant">inventory_2</span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-headline-md text-headline-md tracking-tight text-on-surface">{product.title}</h2>
              <span className={`inline-flex shrink-0 items-center rounded-md border px-2 py-1 font-label-caps text-label-caps ${status.cls}`}>
                {status.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              <span className="rounded-md border border-outline-variant bg-surface-container px-2 py-1 text-on-surface">
                {product.sku}
              </span>
              {product.brand ? (
                <>
                  <span>{product.brand}</span>
                  <span className="text-outline-variant">·</span>
                </>
              ) : null}
              <span>{product.category}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            autoFocus
            disabled={deleting}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition duration-200 hover:bg-row-hover hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
          {/* Pricing */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-primary" />
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">Pricing</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <div className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Purchase / Piece</div>
                <div className="mt-1 font-mono-data text-mono-data tabular-nums text-on-surface">{formatPricePerPiece(product.purchasePrice)}</div>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <div className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Wholesale / Piece</div>
                <div className="mt-1 font-mono-data text-mono-data tabular-nums text-on-surface">{formatPricePerPiece(product.wholesalePrice)}</div>
                <div className="font-mono-data-sm text-mono-data-sm text-primary">{margin}</div>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <div className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Retail (MSRP) / Piece</div>
                <div className="mt-1 font-mono-data text-mono-data tabular-nums text-on-surface">{formatPricePerPiece(product.retailPrice)}</div>
              </div>
            </div>
          </section>

          {/* Inventory */}
          <section className="flex flex-col gap-2.5 border-t border-outline-variant pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm bg-primary" />
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">Inventory</span>
              </div>
              <span className={`font-mono-data-sm text-mono-data-sm ${stock.minColor}`}>
                Reorder at {reorderValue.toLocaleString()} pcs
              </span>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <div className="flex items-end justify-between">
                <span className={`font-metric-display text-metric-display tabular-nums ${stock.textColor}`}>
                  {stockValue.toLocaleString()}
                </span>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">pcs (base)</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                <div className={`h-full ${stock.barColor}`} style={{ width: stock.bar }} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Warehouse" value={product.warehouse || "-"} />
              <DetailItem label="Rack / Bay" value={product.rackBay || "-"} mono />
            </div>
          </section>

          {/* Identification */}
          <section className="flex flex-col gap-2.5 border-t border-outline-variant pt-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-primary" />
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">Identification</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <DetailItem label="SKU" value={product.sku} mono />
              <DetailItem label="Barcode / EAN" value={product.barcode || "-"} mono />
              <DetailItem label="Brand" value={product.brand || "No Brand"} />
              <DetailItem label="Category" value={product.category} />
              <DetailItem label="Base UOM" value={product.uom || "-"} />
              <DetailItem
                label="Catalog Status"
                value={(product.catalogStatus || "active").replace(/^./, (char) => char.toUpperCase())}
              />
            </div>
            {product.description ? (
              <div className="flex flex-col gap-1">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Description</span>
                <p className="whitespace-pre-line font-body-default text-body-default text-on-surface-variant">{product.description}</p>
              </div>
            ) : null}
          </section>

          {/* Compliance */}
          <section className="flex flex-col gap-2.5 border-t border-outline-variant pt-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-primary" />
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">Compliance &amp; Tracking</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Flag active={product.batchTracking} label="Batch Tracking" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Batch Expiry" value={formatDate(product.expiryDate)} mono />
              <DetailItem label="Last Updated" value={formatDate(product.updatedAt || product.createdAt)} mono />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-outline-variant bg-surface-container-low px-5 py-3">
          {deleteError ? (
            <div className="mb-2 rounded-lg border border-error/30 bg-error-container/30 px-3 py-2 font-body-default text-body-default text-error shadow-panel">
              {deleteError}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="truncate font-mono-data-sm text-mono-data-sm text-on-surface-variant">ID: {product._id}</span>

            {confirmingDelete ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-body-dense text-body-dense text-error">Delete this product permanently?</span>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="flex h-9 items-center rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex h-9 items-center gap-2 rounded-lg bg-error px-4 font-body-medium text-body-medium text-on-error shadow-panel transition duration-200 hover:bg-error/90 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[17px]">delete</span>
                  <span>{deleting ? "Deleting..." : "Yes, Delete"}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex h-9 items-center gap-2 rounded-lg border border-error/30 bg-error-container/20 px-4 font-body-medium text-body-medium text-error transition duration-200 hover:bg-error-container/40 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                >
                  <span className="material-symbols-outlined text-[17px]">delete</span>
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px active:bg-primary-hover/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="material-symbols-outlined text-[17px]">edit</span>
                  <span>Edit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
