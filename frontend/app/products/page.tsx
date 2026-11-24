"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { apiFetch } from "../lib/api";
import type { Product } from "./types";
import { formatPricePerPiece, getMargin, getStatus, getStockMeta } from "./product-utils";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { EditProductModal } from "./components/EditProductModal";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch("/api/products");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to fetch products");
        if (active) setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = products.length;
    let active = 0, low = 0, out = 0;
    for (const p of products) {
      const s = getStatus(p).label;
      if (s === "Active") active++;
      if (s === "Low Stock") low++;
      if (s === "Out of Stock") out++;
    }
    return { total, active, low, out };
  }, [products]);

  return (
    <AppShell activePath="products">
      <div className="flex w-full flex-col text-on-surface">
        <div className="flex flex-col justify-between gap-4 pb-4 sm:flex-row sm:items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Products</span>
              <span className="rounded border border-outline-variant bg-surface-container-highest px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
                PK-CATALOG-V4
              </span>
            </div>
            <div className="mt-0.5 font-body-dense text-body-dense text-secondary">
              Catalog Management (Wholesale Master) · Multan Hub &amp; Lahore Central
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container">
              <span className="material-symbols-outlined text-[17px] text-tertiary">auto_fix_high</span>
              <span>Upload Invoice with AI</span>
            </button>
            <button className="flex h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container">
              <span className="material-symbols-outlined text-[17px] text-secondary">file_download</span>
              <span>Export CSV</span>
            </button>
            <a href="/products/add" className="flex h-[34px] items-center gap-1.5 rounded bg-primary-container px-3.5 font-body-medium text-body-medium text-on-primary shadow-sm transition-colors hover:bg-primary">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add Product</span>
            </a>
          </div>
        </div>

        <div className="mb-4 grid w-full grid-cols-2 divide-y divide-outline-variant rounded border border-outline-variant bg-surface-container-lowest md:grid-cols-4 md:divide-x md:divide-y-0">
          {[
            { label: "Total SKUs", value: stats.total, icon: "inventory_2", iconColor: "text-secondary", sub: "From database", subColor: "text-secondary" },
            { label: "Active Products", value: stats.active, icon: "check_circle", iconColor: "text-primary", sub: "Ready for dispatch", subColor: "text-secondary" },
            { label: "Low Stock", value: stats.low, icon: "warning", iconColor: "text-error", sub: "Needs reorder", subColor: "text-error", wrap: "bg-error-container/20", valueColor: "text-error", labelColor: "text-error" },
            { label: "Out of Stock", value: stats.out, icon: "block", iconColor: "text-outline", sub: "Zero warehouse count", subColor: "text-secondary", valueColor: "text-secondary" },
          ].map((c) => (
            <div key={c.label} className={`flex flex-col justify-between p-3.5 sm:px-4 sm:py-3.5 ${c.wrap || ""}`}>
              <div className="flex items-center justify-between">
                <span className={`font-label-caps text-label-caps uppercase ${c.labelColor || "text-secondary"}`}>{c.label}</span>
                <span className={`material-symbols-outlined text-[18px] ${c.iconColor}`}>{c.icon}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`font-metric-display text-metric-display tabular-nums ${c.valueColor || "text-on-surface"}`}>{c.value.toLocaleString()}</span>
              </div>
              <span className={`mt-0.5 font-mono-data-sm text-mono-data-sm ${c.subColor}`}>{c.sub}</span>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mb-3 rounded border border-error/30 bg-error-container/30 px-3 py-2 font-body-default text-body-default text-error">
            {error}. Make sure backend is running and `MONGODB_URI` in <code>backend/.env</code> is correct.
          </div>
        ) : null}

        <div className="relative w-full overflow-visible rounded border border-outline-variant bg-surface-container-lowest">
          <div className="min-h-[240px] overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="h-8 border-b border-outline-variant bg-surface-container-low">
                  <th className="px-3.5 py-1 font-label-caps text-label-caps uppercase tracking-wider text-secondary">Product Name &amp; Details</th>
                  <th className="px-3 py-1 font-label-caps text-label-caps uppercase tracking-wider text-secondary">SKU</th>
                  <th className="px-3 py-1 font-label-caps text-label-caps uppercase tracking-wider text-secondary">Category</th>
                  <th className="px-3 py-1 text-right font-label-caps text-label-caps uppercase tracking-wider text-secondary">Purchase / Piece</th>
                  <th className="px-3 py-1 text-right font-label-caps text-label-caps uppercase tracking-wider text-secondary">Wholesale / Piece</th>
                  <th className="px-3 py-1 font-label-caps text-label-caps uppercase tracking-wider text-secondary">Warehouse Balance</th>
                  <th className="px-3 py-1 text-center font-label-caps text-label-caps uppercase tracking-wider text-secondary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant font-body-default text-body-default">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center font-body-default text-secondary">Loading products from database...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center font-body-default text-secondary">No products found in database. <a href="/products/add" className="text-primary underline">Add your first product</a>.</td></tr>
                ) : (
                  products.map((p) => {
                    const status = getStatus(p);
                    const stock = getStockMeta(p);
                    const margin = getMargin(p);
                    return (
                      <tr
                        key={p._id}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${p.title}`}
                        onClick={() => setSelectedProduct(p)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedProduct(p);
                          }
                        }}
                        className={`h-10 cursor-pointer transition-colors focus:outline-none focus-visible:bg-surface-container ${
                          stock.faded
                            ? "bg-surface-container-low/50 hover:bg-surface-container-low"
                            : "hover:bg-surface-container-low"
                        }`}
                      >
                        <td className="px-3.5 py-1.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border border-outline-variant bg-surface-container">
                              {p.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px] text-secondary">inventory_2</span>
                              )}
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-body-medium text-body-default text-on-surface">{p.title}</span>
                                <span className="rounded border border-outline-variant bg-surface-container px-1 py-0.5 font-label-caps text-[9px] uppercase text-secondary">{p.brand}</span>
                              </div>
                              <span className="font-mono-data-sm text-mono-data-sm text-secondary">{p.barcode || p.rackBay || "-"}</span>
                            </div>
                            <span className="material-symbols-outlined ml-auto shrink-0 text-[16px] text-outline">chevron_right</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-1.5"><span className="rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface">{p.sku}</span></td>
                        <td className="whitespace-nowrap px-3 py-1.5"><span className="font-body-dense text-body-dense text-on-surface-variant">{p.category}</span></td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-right"><span className="font-mono-data text-mono-data tabular-nums text-on-surface">{formatPricePerPiece(p.purchasePrice)}</span></td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono-data text-mono-data font-medium tabular-nums text-on-surface">{formatPricePerPiece(p.wholesalePrice)}</span>
                            <span className="font-mono-data-sm text-mono-data-sm text-primary">{margin}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-1.5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`font-body-medium text-body-dense font-medium tabular-nums ${stock.textColor}`}>{stock.text}</span>
                              <span className={`font-mono-data-sm text-mono-data-sm ${stock.minColor}`}>{stock.minText}</span>
                            </div>
                            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-surface-variant"><div className={`h-full ${stock.barColor}`} style={{ width: stock.bar }}></div></div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-center"><span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-label-caps text-label-caps ${status.cls}`}>{status.label}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-3.5 py-2.5 font-body-dense text-body-dense">
            <span className="text-secondary">Showing <strong className="font-mono-data text-mono-data text-on-surface">{products.length}</strong> products from database</span>
            <a href="/products/add" className="text-primary hover:underline">+ Add Product</a>
          </div>
        </div>
      </div>

      <ProductDetailModal
        key={selectedProduct?._id ?? "product-detail"}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onEdit={(product) => {
          setEditingProduct(product);
          setSelectedProduct(null);
        }}
        onDeleted={(id) => {
          setProducts((current) => current.filter((item) => item._id !== id));
          setSelectedProduct(null);
        }}
      />

      {editingProduct ? (
        <EditProductModal
          key={editingProduct._id}
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={(updated) => {
            setProducts((current) => current.map((item) => (item._id === updated._id ? updated : item)));
            setEditingProduct(null);
            setSelectedProduct(updated);
          }}
        />
      ) : null}
    </AppShell>
  );
}
