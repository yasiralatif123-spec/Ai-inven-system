"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { apiFetch } from "../../lib/api";
import { PRODUCT_CATEGORIES, STOCK_UNITS, TAX_BRACKETS, WAREHOUSES } from "../product-options";

const initialForm = {
  title: "",
  sku: "",
  barcode: "",
  category: "Cooking Oil & Ghee",
  brand: "",
  description: "",
  purchasePrice: "",
  wholesalePrice: "",
  retailPrice: "",
  taxBracket: "Standard Sales Tax (18% FBR SRO)",
  uom: "Carton / Master Case",
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
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetForm() {
    setForm(blankForm());
    setImage(null);
    setPreview("");
  }

  const margins = useMemo(() => {
    const cost = Number(String(form.purchasePrice).replace(/,/g, "")) || 0;
    const wholesale = Number(String(form.wholesalePrice).replace(/,/g, "")) || 0;
    const retail = Number(String(form.retailPrice).replace(/,/g, "")) || 0;
    const wPct = cost > 0 ? (((wholesale - cost) / cost) * 100).toFixed(1) : "0.0";
    const rPct = cost > 0 ? (((retail - cost) / cost) * 100).toFixed(1) : "0.0";
    return { wPct, rPct, wAmt: Math.max(0, wholesale - cost), rAmt: Math.max(0, retail - cost) };
  }, [form.purchasePrice, form.wholesalePrice, form.retailPrice]);

  function set<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  }

  async function submit(createAnother = false) {
    setError(null);
    setSuccess(null);
    if (!form.title || !form.sku || !form.category || !form.brand) {
      setError("Please fill required fields: Product Title, SKU, Category, and Brand/Manufacturer.");
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
      <div className="flex w-full flex-col gap-6 text-on-surface pb-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono-data-sm text-mono-data-sm text-secondary">
              <Link href="/products" className="hover:text-primary hover:underline">Products</Link>
              <span className="text-outline-variant">/</span>
              <span>Catalog Management</span>
              <span className="text-outline-variant">/</span>
              <span className="font-body-medium text-primary">New Product Entry</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">Add Product</h1>
            <p className="font-body-default text-body-default text-on-surface-variant">Create a product record and store it in MongoDB. Image uploads use Cloudinary.</p>
          </div>
        </div>

        {error ? <div className="rounded border border-error/30 bg-error-container/30 px-3 py-2 text-error font-body-default">{error}</div> : null}
        {success ? <div className="rounded border border-[#D1E8DC] bg-[#EBF5F0] px-3 py-2 text-[#2E7D58] font-body-default">{success}</div> : null}

        <form autoComplete="off" className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); submit(false); }}>
          {/* A. Basic Information */}
          <div className="flex flex-col gap-5 rounded border border-outline-variant bg-surface-container-lowest p-5">
            <div className="flex items-start justify-between border-b border-outline-variant pb-3">
              <div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary"></span><span className="font-label-caps text-label-caps uppercase tracking-wider">A. Basic Information</span></div>
                <p className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">Identification, barcode, and catalog classification</p>
              </div>
              <span className="rounded bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">SEC #01</span>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="flex flex-col gap-1.5 lg:col-span-4">
                <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">Product Master Image</label>
                <div className="relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-outline-variant bg-surface-container-low p-6 text-center transition-colors hover:border-primary">
                  <input accept="image/png,image/jpeg" className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" type="file" onChange={onImageChange} />
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="max-h-40 rounded object-contain" />
                  ) : (
                    <>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-primary"><span className="material-symbols-outlined text-[24px]">add_photo_alternate</span></div>
                      <div className="font-body-medium text-body-medium text-on-surface">Upload product image</div>
                      <p className="mt-1 max-w-[200px] font-body-dense text-body-dense text-secondary">PNG, JPG up to 5MB (stored in Cloudinary)</p>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-8">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider" htmlFor="title">Product Title <span className="text-error">*</span></label>
                  <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-body-default text-body-default focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container" placeholder="e.g. Dalda Cooking Oil 5L Tin (Case of 4)" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider" htmlFor="sku">SKU / Item Code <span className="text-error">*</span></label>
                  <input id="sku" value={form.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-mono-data text-mono-data uppercase focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container" placeholder="e.g. DAL-CO-5L" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider" htmlFor="barcode">Barcode / EAN-13</label>
                  <input id="barcode" value={form.barcode} onChange={(e) => set("barcode", e.target.value)} className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-mono-data text-mono-data focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container" placeholder="e.g. 8964000124891" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider" htmlFor="category">Category <span className="text-error">*</span></label>
                  <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-body-default focus:border-primary-container focus:outline-none">
                    {PRODUCT_CATEGORIES.map((o)=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider" htmlFor="brand">Brand / Manufacturer <span className="text-error">*</span></label>
                  <input id="brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-body-default focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container" placeholder="e.g. Dalda Foods Ltd" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 border-t border-outline-variant pt-2">
              <label className="font-label-caps text-label-caps uppercase tracking-wider" htmlFor="description">Commercial Specs &amp; Invoice Note</label>
              <textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded border border-outline-variant bg-surface-container-lowest p-2.5 font-body-default focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container" placeholder="Packaging, storage, composition, etc." />
            </div>
          </div>

          {/* B. Pricing */}
          <div className="flex flex-col gap-5 rounded border border-outline-variant bg-surface-container-lowest p-5">
            <div className="flex items-start justify-between border-b border-outline-variant pb-3">
              <div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary"></span><span className="font-label-caps text-label-caps uppercase tracking-wider">B. Pricing Tiers &amp; FBR Taxation</span></div>
                <p className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">Cost, wholesale, retail, and tax regime</p>
              </div>
              <span className="rounded bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">SEC #02</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {([
                { key: "purchasePrice", label: "1. Purchase Price (Cost)" },
                { key: "wholesalePrice", label: "2. Wholesale Price (Trade)" },
                { key: "retailPrice", label: "3. Retail MSRP (Consumer)" },
              ] as const).map((f) => (
                <div key={f.key} className="flex flex-col gap-1.5 rounded border border-outline-variant bg-surface-container-low p-3">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">{f.label}</label>
                  <input value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 text-right font-mono-data focus:border-primary-container focus:outline-none" placeholder="0.00" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 items-center gap-4 rounded border border-outline-variant bg-surface-container p-3.5 md:grid-cols-12">
              <div className="md:col-span-7 flex flex-wrap items-center gap-2 font-mono-data text-mono-data">
                <span className="rounded border border-[#D1E8DC] bg-[#EBF5F0] px-2.5 py-1 font-semibold text-[#2E7D58]">Wholesale Margin: +{margins.wPct}% (Rs. {margins.wAmt.toLocaleString()})</span>
                <span className="rounded border border-outline-variant bg-surface-container-lowest px-2.5 py-1">MSRP Spread: +{margins.rPct}%</span>
              </div>
              <div className="md:col-span-5 flex flex-col gap-1">
                <label className="font-label-caps text-label-caps uppercase tracking-wider">FBR Sales Tax Regime</label>
                <select value={form.taxBracket} onChange={(e) => set("taxBracket", e.target.value)} className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-body-default focus:border-primary-container focus:outline-none">
                  {TAX_BRACKETS.map((o)=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* C. Inventory */}
          <div className="flex flex-col gap-5 rounded border border-outline-variant bg-surface-container-lowest p-5">
            <div className="flex items-start justify-between border-b border-outline-variant pb-3">
              <div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary"></span><span className="font-label-caps text-label-caps uppercase tracking-wider">C. Inventory, Packaging &amp; Warehouse</span></div>
                <p className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">Stock units, depot, and reorder thresholds</p>
              </div>
              <span className="rounded bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">SEC #03</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-label-caps uppercase tracking-wider">Base Stock Unit (UOM)</label>
                <select value={form.uom} onChange={(e) => set("uom", e.target.value)} className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 focus:border-primary-container focus:outline-none">
                  {STOCK_UNITS.map((o)=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-label-caps uppercase tracking-wider">Opening Stock (Base Pieces)</label>
                <input type="number" min={0} value={form.openingStock} onChange={(e) => set("openingStock", e.target.value)} className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-mono-data focus:border-primary-container focus:outline-none" />
                <span className="font-mono-data-sm text-mono-data-sm text-secondary">Stored internally as pieces. 1 Carton = 24 pcs, 1 Box = 12 pcs.</span>
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
                  className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-mono-data focus:border-primary-container focus:outline-none"
                />
                <span className="font-mono-data-sm text-mono-data-sm text-secondary">Alert when available stock falls below this number of pieces.</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 border-t border-outline-variant pt-2 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-label-caps uppercase tracking-wider">Primary Depot Allocation</label>
                <select value={form.warehouse} onChange={(e) => set("warehouse", e.target.value)} className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 focus:border-primary-container focus:outline-none">
                  {WAREHOUSES.map((o)=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-label-caps uppercase tracking-wider">Storage Bay / Pallet Rack ID</label>
                <input value={form.rackBay} onChange={(e) => set("rackBay", e.target.value)} className="h-[34px] rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-mono-data focus:border-primary-container focus:outline-none" placeholder="e.g. Aisle 4, Bay C-12, Level 2" />
              </div>
            </div>
          </div>

          {/* D. Compliance & Status */}
          <div className="flex flex-col gap-5 rounded border border-outline-variant bg-surface-container-lowest p-5">
            <div className="flex items-start justify-between border-b border-outline-variant pb-3">
              <div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary"></span><span className="font-label-caps text-label-caps uppercase tracking-wider">D. Compliance, Expiry &amp; Catalog Status</span></div>
              </div>
              <span className="rounded bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">SEC #04</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([
                ["active", "Active", "Available for immediate sales"],
                ["draft", "Draft", "Hidden from sales terminals"],
                ["discontinued", "Discontinued", "Prevent future reorders"],
              ] as const).map(([val, label, desc]) => (
                <label key={val} className={`flex cursor-pointer items-center gap-3 rounded border p-3 ${form.catalogStatus===val ? "border-primary-container bg-surface-container" : "border-outline-variant bg-surface-container-lowest"}`}>
                  <input type="radio" name="catalog_status" checked={form.catalogStatus===val} onChange={() => set("catalogStatus", val)} className="h-4 w-4 text-primary" />
                  <div><div className="font-body-medium text-body-medium">{label}</div><div className="font-mono-data-sm text-[11px] text-secondary">{desc}</div></div>
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-outline-variant pt-2">
              <label className="flex items-start gap-2.5"><input type="checkbox" checked={form.batchTracking} onChange={(e)=>set("batchTracking", e.target.checked)} className="mt-0.5 h-4 w-4 rounded" /><div><div className="font-body-medium">Enable Strict Batch / Lot Tracking</div><div className="font-mono-data-sm text-secondary">For FEFO stock rotation</div></div></label>
              <div className="flex flex-col gap-1.5 pl-6">
                <label className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">Initial Batch Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={(e)=>set("expiryDate", e.target.value)} className="h-[34px] max-w-xs rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-mono-data" />
              </div>
            </div>
          </div>

          {/* Sticky Actions */}
          <div className="fixed bottom-0 left-60 right-0 z-40 flex items-center justify-between border-t border-outline-variant bg-surface-container-lowest px-6 py-2.5 shadow-sm">
            <div className="flex items-center gap-2 font-mono-data-sm text-mono-data-sm text-secondary">
              <span className="material-symbols-outlined text-[16px] text-primary">cloud_upload</span>
              <span>Image will be uploaded to Cloudinary on save</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Link href="/products" className="flex h-[34px] items-center rounded border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium hover:bg-surface-container">Cancel</Link>
              <button type="button" disabled={submitting} onClick={() => submit(true)} className="hidden h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-primary hover:bg-surface-container sm:flex disabled:opacity-50">
                <span className="material-symbols-outlined text-[16px]">library_add</span><span>Save &amp; Create Another</span>
              </button>
              <button type="submit" disabled={submitting} className="flex h-[34px] items-center gap-1.5 rounded bg-primary-container px-4 font-body-medium text-body-medium text-on-primary shadow-sm transition-colors hover:bg-primary disabled:opacity-50">
                <span className="material-symbols-outlined text-[17px]">check_circle</span><span>{submitting ? "Saving..." : "Save Product"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
