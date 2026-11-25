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
        <div className="flex flex-col justify-between gap-5 pb-6 sm:flex-row sm:items-end">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-headline-xl text-headline-xl tracking-tight text-on-surface">Products</span>
              <span className="rounded-md border border-outline-variant bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                PK-CATALOG-V4
              </span>
            </div>
            <div className="mt-1 font-body-default text-body-default text-on-surface-variant">
              Catalog Management (Wholesale Master) · Multan Hub &amp; Lahore Central
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span className="material-symbols-outlined text-[18px] text-tertiary">auto_fix_high</span>
              <span>Upload Invoice with AI</span>
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">file_download</span>
              <span>Export CSV</span>
            </button>
            <a href="/products/add" className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px active:bg-primary-hover/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span className="material-symbols-outlined text-[19px]">add</span>
              <span>Add Product</span>
            </a>
          </div>
        </div>

        <div className="mb-5 grid w-full grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total SKUs", value: stats.total, icon: "inventory_2", iconColor: "text-on-surface-variant", sub: "From database", subColor: "text-on-surface-variant" },
            { label: "Active Products", value: stats.active, icon: "check_circle", iconColor: "text-primary", sub: "Ready for dispatch", subColor: "text-on-surface-variant" },
            { label: "Low Stock", value: stats.low, icon: "warning", iconColor: "text-error", sub: "Needs reorder", subColor: "text-error", wrap: "border-error-container bg-error-container/20", valueColor: "text-error", labelColor: "text-error" },
            { label: "Out of Stock", value: stats.out, icon: "block", iconColor: "text-outline", sub: "Zero warehouse count", subColor: "text-on-surface-variant", valueColor: "text-on-surface-variant" },
          ].map((c) => (
            <div key={c.label} className={`flex min-h-[120px] flex-col justify-between rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-panel transition duration-200 hover:border-border ${c.wrap || ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`font-label-caps text-label-caps uppercase ${c.labelColor || "text-on-surface-variant"}`}>{c.label}</span>
                <span className={`material-symbols-outlined text-[19px] ${c.iconColor}`}>{c.icon}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`font-metric-display text-metric-display tabular-nums ${c.valueColor || "text-on-surface"}`}>{c.value.toLocaleString()}</span>
              </div>
              <span className={`mt-1 font-mono-data-sm text-mono-data-sm ${c.subColor}`}>{c.sub}</span>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 font-body-default text-body-default text-error shadow-panel">
            {error}. Make sure backend is running and `MONGODB_URI` in <code>backend/.env</code> is correct.
          </div>
        ) : null}

        <div className="relative w-full overflow-visible rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel">
          <div className="min-h-[280px] overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="h-10 border-b border-outline-variant bg-surface-container-low">
                  <th className="px-4 py-2 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Product Name &amp; Details</th>
                  <th className="px-4 py-2 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">SKU</th>
                  <th className="px-4 py-2 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Category</th>
                  <th className="px-4 py-2 text-right font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Purchase / Piece</th>
                  <th className="px-4 py-2 text-right font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Wholesale / Piece</th>
                  <th className="px-4 py-2 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Warehouse Balance</th>
                  <th className="px-4 py-2 text-center font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-body-default text-body-default">
                {loading ? (
                  <tr className="animate-pulse"><td colSpan={7} className="px-4 py-16 text-center font-body-default text-on-surface-variant">Loading products from database...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center font-body-default text-on-surface-variant">No products found in database. <a href="/products/add" className="rounded-md px-1.5 py-1 font-medium text-primary transition duration-200 hover:bg-row-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Add your first product</a>.</td></tr>
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
                        className={`h-12 cursor-pointer transition duration-200 focus:outline-none focus-visible:bg-row-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                          stock.faded
                            ? "bg-surface-container-low/50 hover:bg-surface-container-low"
                            : "hover:bg-surface-container-low"
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container">
                              {p.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">inventory_2</span>
                              )}
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-body-medium text-body-default text-on-surface">{p.title}</span>
                                <span className="rounded-md border border-outline-variant bg-surface-container px-2 py-0.5 font-label-caps text-[10px] uppercase text-on-surface-variant">{p.brand}</span>
                              </div>
                              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">{p.barcode || p.rackBay || "-"}</span>
                            </div>
                            <span className="material-symbols-outlined ml-auto shrink-0 text-[18px] text-on-surface-variant">chevron_right</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5"><span className="rounded-md border border-outline-variant bg-surface-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface">{p.sku}</span></td>
                        <td className="whitespace-nowrap px-4 py-2.5"><span className="font-body-dense text-body-dense text-on-surface-variant">{p.category}</span></td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right"><span className="font-mono-data text-mono-data tabular-nums text-on-surface">{formatPricePerPiece(p.purchasePrice)}</span></td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono-data text-mono-data font-medium tabular-nums text-on-surface">{formatPricePerPiece(p.wholesalePrice)}</span>
                            <span className="font-mono-data-sm text-mono-data-sm text-primary">{margin}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`font-body-medium text-body-dense font-medium tabular-nums ${stock.textColor}`}>{stock.text}</span>
                              <span className={`font-mono-data-sm text-mono-data-sm ${stock.minColor}`}>{stock.minText}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-surface-variant"><div className={`h-full ${stock.barColor}`} style={{ width: stock.bar }}></div></div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center"><span className={`inline-flex items-center rounded-md border px-2 py-1 font-label-caps text-label-caps ${status.cls}`}>{status.label}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant bg-surface-container-low px-4 py-3 font-body-default text-body-default text-on-surface-variant">
            <span>Showing <strong className="font-mono-data text-mono-data text-on-surface">{products.length}</strong> products from database</span>
            <a href="/products/add" className="rounded-md px-2 py-1 font-medium text-primary transition duration-200 hover:bg-row-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">+ Add Product</a>
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
