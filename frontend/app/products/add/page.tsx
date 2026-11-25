"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { apiFetch } from "../../lib/api";
import type { StockUnit } from "../../lib/units";
import { BrandAutocomplete, type Brand } from "../../../features/brands";
import { PRODUCT_CATEGORIES, STOCK_UNITS, TAX_BRACKETS, WAREHOUSES } from "../product-options";
import {
  canonicalPriceFromDisplay,
  displayPricesFromCanonical,
  type CanonicalPrices,
  type PriceField,
} from "../price-fields";

function emptyCanonicalPrices(): CanonicalPrices {
  return { purchasePrice: null, wholesalePrice: null, retailPrice: null };
}

const initialForm = {
  title: "",
  sku: "",
  barcode: "",
  category: "Cooking Oil & Ghee",
  brand: "",
  brandId: "",
  description: "",
  purchasePrice: "",
  wholesalePrice: "",
  retailPrice: "",
  priceUnit: "Piece" as StockUnit,
  taxBracket: "Standard Sales Tax (18% FBR SRO)",
  uom: "Carton",
  openingStock: "0",
  reorderThreshold: "",
  warehouse: "Lahore Central Warehouse (Depot 01 - Kot Lakhpat)",
  rackBay: "",
  catalogStatus: "active",
  batchTracking: false,
  expiryDate: "",
};

function blankForm() {
  return { ...initialForm };
}

export default function AddProductPage() {
  const pathname = usePathname();
  return <AddProductForm key={pathname} />;
}

function AddProductForm() {
  const router = useRouter();
  const [form, setForm] = useState(blankForm);
  const [canonicalPrices, setCanonicalPrices] = useState<CanonicalPrices>(emptyCanonicalPrices);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  function resetForm() {
    setForm(blankForm());
    setSelectedBrand(null);
    setCanonicalPrices(emptyCanonicalPrices());
    setImage(null);
    setPreview("");
  }

  const margins = useMemo(() => {
    const cost = canonicalPrices.purchasePrice ?? 0;
    const wholesale = canonicalPrices.wholesalePrice ?? 0;
    const retail = canonicalPrices.retailPrice ?? 0;
    const wPct = cost > 0 ? (((wholesale - cost) / cost) * 100).toFixed(1) : "0.0";
    const rPct = cost > 0 ? (((retail - cost) / cost) * 100).toFixed(1) : "0.0";
    return { wPct, rPct, wAmt: Math.max(0, wholesale - cost), rAmt: Math.max(0, retail - cost) };
  }, [canonicalPrices]);

  function set<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setPrice(field: PriceField, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setCanonicalPrices((current) => ({
      ...current,
      [field]: canonicalPriceFromDisplay(value, form.priceUnit),
    }));
  }

  function setPriceUnit(unit: StockUnit) {
    // Always rebuild from canonical values so repeated unit changes never drift.
    const display = displayPricesFromCanonical(canonicalPrices, unit);
    setForm((f) => ({ ...f, priceUnit: unit, ...display }));
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  }

  async function submit(createAnother = false) {
    setError(null);
    setSuccess(null);
    if (!form.title.trim() || !form.sku.trim() || !form.category.trim()) {
      setError("Please fill required fields: Product Title, SKU, and Category.");
      return;
    }
    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((entry) => fd.append(k, String(entry)));
        else fd.append(k, String(v));
      });
      if (image) fd.append("image", image);

      const res = await apiFetch("/api/products", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to save product");

      if (createAnother) {
        resetForm();
        setSuccess(`Product ${form.sku} saved successfully.`);
      } else {
        router.push("/products");
        router.refresh();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell activePath="products">
      <div className="flex w-full flex-col gap-6 pb-28 text-on-surface">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              <Link href="/products" className="rounded-md px-1 py-0.5 transition duration-200 hover:bg-row-hover hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Products</Link>
              <span className="text-outline-variant">/</span>
              <span>Catalog Management</span>
              <span className="text-outline-variant">/</span>
              <span className="font-body-medium text-primary">New Product Entry</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">Add Product</h1>
            <p className="font-body-default text-body-default text-on-surface-variant">Create a product record and store it in MongoDB. Image uploads use Cloudinary.</p>
          </div>
        </div>

        {error ? <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 font-body-default text-body-default text-error shadow-panel">{error}</div> : null}
        {success ? <div className="rounded-xl border border-primary/20 bg-primary-fixed/20 px-4 py-3 font-body-default text-body-default text-primary shadow-panel">{success}</div> : null}

        <form autoComplete="off" className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); submit(false); }}>
          {/* A. Basic Information */}
          <div className="flex flex-col gap-5 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-panel">
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary"></span><span className="font-label-caps text-label-caps uppercase tracking-wider">A. Basic Information</span></div>
                <p className="mt-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">Identification, barcode, and catalog classification</p>
              </div>
              <span className="rounded-lg bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">SEC #01</span>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="flex flex-col gap-1.5 lg:col-span-4">
                <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">Product Master Image</label>
                <div className="relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low p-8 text-center transition duration-200 hover:border-primary-container hover:bg-row-hover">
                  <input accept="image/png,image/jpeg" className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" type="file" onChange={onImageChange} />
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="max-h-44 rounded-lg object-contain shadow-panel" />
                  ) : (
                    <>
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-high text-primary"><span className="material-symbols-outlined text-[26px]">add_photo_alternate</span></div>
                      <div className="font-body-medium text-body-medium text-on-surface">Upload product image</div>
                      <p className="mt-1.5 max-w-[220px] font-body-dense text-body-dense text-on-surface-variant">PNG, JPG up to 5MB (stored in Cloudinary)</p>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:col-span-8">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider" htmlFor="title">Product Title <span className="text-error">*</span></label>
                  <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default text-body-default transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Dalda Cooking Oil 5L Tin (Case of 4)" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider" htmlFor="sku">SKU / Item Code <span className="text-error">*</span></label>
                  <input id="sku" value={form.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data uppercase transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. DAL-CO-5L" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider" htmlFor="barcode">Barcode / EAN-13</label>
                  <input id="barcode" value={form.barcode} onChange={(e) => set("barcode", e.target.value)} className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. 8964000124891" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider" htmlFor="category">Category <span className="text-error">*</span></label>
                  <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
                    {PRODUCT_CATEGORIES.map((o)=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <BrandAutocomplete
                  id="brand"
                  value={form.brandId}
                  selectedBrand={selectedBrand}
                  onChange={(brandId, brand) => {
                    // Only the selected brandId is submitted. The name is a
                    // display snapshot; typed search text is never saved.
                    setSelectedBrand(brand);
                    set("brandId", brandId);
                    set("brand", brand?.name || "");
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 border-t border-outline-variant pt-2">
              <label className="font-label-caps text-label-caps uppercase tracking-wider" htmlFor="description">Commercial Specs &amp; Invoice Note</label>
              <textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 font-body-default leading-relaxed transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Packaging, storage, composition, etc." />
            </div>
          </div>

          {/* B. Pricing */}
          <div className="flex flex-col gap-5 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-panel">
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary"></span><span className="font-label-caps text-label-caps uppercase tracking-wider">B. Pricing Tiers &amp; FBR Taxation</span></div>
                <p className="mt-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">Cost, wholesale, retail, and tax regime</p>
              </div>
              <span className="rounded-lg bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">SEC #02</span>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-4 md:max-w-sm">
              <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant" htmlFor="priceUnit">
                Price Entry Unit
              </label>
              <select
                id="priceUnit"
                value={form.priceUnit}
                onChange={(event) => setPriceUnit(event.target.value as StockUnit)}
                className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {STOCK_UNITS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                All prices below are converted and stored per Piece.
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {([
                { key: "purchasePrice", label: "1. Purchase Price (Cost)" },
                { key: "wholesalePrice", label: "2. Wholesale Price (Trade)" },
                { key: "retailPrice", label: "3. Retail MSRP (Consumer)" },
              ] as const).map((f) => (
                <div key={f.key} className="flex flex-col gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                    {f.label} / {form.priceUnit}
                  </label>
                  <input value={form[f.key]} onChange={(e) => setPrice(f.key, e.target.value)} className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-right font-mono-data text-mono-data transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0.00" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 items-center gap-4 rounded-xl border border-outline-variant bg-surface-container p-4 md:grid-cols-12">
              <div className="md:col-span-7 flex flex-wrap items-center gap-2 font-mono-data text-mono-data">
                <span className="rounded-lg border border-primary/20 bg-primary-fixed/20 px-3 py-1.5 font-semibold text-primary">Wholesale Margin: +{margins.wPct}% (Rs. {margins.wAmt.toLocaleString()} / Piece)</span>
                <span className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5">MSRP Spread: +{margins.rPct}%</span>
              </div>
              <div className="md:col-span-5 flex flex-col gap-1">
                <label className="font-label-caps text-label-caps uppercase tracking-wider">FBR Sales Tax Regime</label>
                <select value={form.taxBracket} onChange={(e) => set("taxBracket", e.target.value)} className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
                  {TAX_BRACKETS.map((o)=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* C. Inventory */}
          <div className="flex flex-col gap-5 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-panel">
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary"></span><span className="font-label-caps text-label-caps uppercase tracking-wider">C. Inventory, Packaging &amp; Warehouse</span></div>
                <p className="mt-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">Stock units, depot, and reorder thresholds</p>
              </div>
              <span className="rounded-lg bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">SEC #03</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-label-caps uppercase tracking-wider">Base Stock Unit (UOM)</label>
                <select value={form.uom} onChange={(e) => set("uom", e.target.value)} className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
                  {STOCK_UNITS.map((o)=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-label-caps uppercase tracking-wider">Opening Stock (Base Pieces)</label>
                <input type="number" min={0} value={form.openingStock} onChange={(e) => set("openingStock", e.target.value)} className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Stored internally as pieces. 1 Carton = 24 pcs, 1 Box = 12 pcs.</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-label-caps uppercase tracking-wider">
                  Reorder Alert Threshold (Pieces) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={form.reorderThreshold || 0}
                  onChange={(e) => set("reorderThreshold", e.target.value)}
                  className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Alert when available stock falls below this number of pieces.</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 border-t border-outline-variant pt-2 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-label-caps uppercase tracking-wider">Primary Depot Allocation</label>
                <select value={form.warehouse} onChange={(e) => set("warehouse", e.target.value)} className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
                  {WAREHOUSES.map((o)=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-label-caps uppercase tracking-wider">Storage Bay / Pallet Rack ID</label>
                <input value={form.rackBay} onChange={(e) => set("rackBay", e.target.value)} className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Aisle 4, Bay C-12, Level 2" />
              </div>
            </div>
          </div>

          {/* D. Compliance & Status */}
          <div className="flex flex-col gap-5 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-panel">
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary"></span><span className="font-label-caps text-label-caps uppercase tracking-wider">D. Compliance, Expiry &amp; Catalog Status</span></div>
              </div>
              <span className="rounded-lg bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">SEC #04</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([
                ["active", "Active", "Available for immediate sales"],
                ["draft", "Draft", "Hidden from sales terminals"],
                ["discontinued", "Discontinued", "Prevent future reorders"],
              ] as const).map(([val, label, desc]) => (
                <label key={val} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition duration-200 hover:border-border ${form.catalogStatus===val ? "border-primary-container bg-primary-fixed/20" : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"}`}>
                  <input type="radio" name="catalog_status" checked={form.catalogStatus===val} onChange={() => set("catalogStatus", val)} className="h-4 w-4 accent-primary" />
                  <div><div className="font-body-medium text-body-medium text-on-surface">{label}</div><div className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">{desc}</div></div>
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-outline-variant pt-2">
              <label className="flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3"><input type="checkbox" checked={form.batchTracking} onChange={(e)=>set("batchTracking", e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-primary" /><div><div className="font-body-medium text-body-medium text-on-surface">Enable Strict Batch / Lot Tracking</div><div className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">For FEFO stock rotation</div></div></label>
              <div className="flex flex-col gap-2 pl-7">
                <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Initial Batch Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={(e)=>set("expiryDate", e.target.value)} className="h-9 w-full max-w-xs rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          {/* Sticky Actions */}
          <div className="fixed bottom-0 left-60 right-0 z-40 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-lowest px-8 py-3 shadow-panel">
            <div className="flex items-center gap-2 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[17px] text-primary">cloud_upload</span>
              <span>Image will be uploaded to Cloudinary on save</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Link href="/products" className="flex h-9 items-center rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Cancel</Link>
              <button type="button" disabled={submitting} onClick={() => submit(true)} className="hidden h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-medium text-body-medium text-primary transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex disabled:opacity-50">
                <span className="material-symbols-outlined text-[17px]">library_add</span><span>Save &amp; Create Another</span>
              </button>
              <button type="submit" disabled={submitting} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-5 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px active:bg-primary-hover/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">
                <span className="material-symbols-outlined text-[18px]">check_circle</span><span>{submitting ? "Saving..." : "Save Product"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
