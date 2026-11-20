"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "../../lib/api";
import type { Product } from "../types";
import { FlavorInput } from "./FlavorInput";
import {
  CATALOG_STATUSES,
  PRODUCT_CATEGORIES,
  STOCK_UNITS,
  TAX_BRACKETS,
  WAREHOUSES,
} from "../product-options";

type CatalogStatus = (typeof CATALOG_STATUSES)[number]["value"];

type FormState = {
  title: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  description: string;
  flavors: string[];
  purchasePrice: string;
  wholesalePrice: string;
  retailPrice: string;
  taxBracket: string;
  uom: string;
  openingStock: string;
  reorderThreshold: string;
  warehouse: string;
  rackBay: string;
  catalogStatus: CatalogStatus;
  batchTracking: boolean;
  expiryDate: string;
};

type EditProductModalProps = {
  product: Product;
  onClose: () => void;
  onSaved: (product: Product) => void;
};

const inputClass =
  "h-[34px] w-full rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-body-default text-body-default text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container";

const monoInputClass =
  "h-[34px] w-full rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-mono-data text-mono-data text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container";

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildInitialForm(product: Product): FormState {
  return {
    title: product.title || "",
    sku: product.sku || "",
    barcode: product.barcode || "",
    category: product.category || PRODUCT_CATEGORIES[0],
    brand: product.brand || "",
    description: product.description || "",
    flavors: Array.isArray(product.flavors) ? [...product.flavors] : [],
    purchasePrice: product.purchasePrice !== undefined ? String(product.purchasePrice) : "",
    wholesalePrice: product.wholesalePrice !== undefined ? String(product.wholesalePrice) : "",
    retailPrice: product.retailPrice !== undefined ? String(product.retailPrice) : "",
    taxBracket: product.taxBracket || TAX_BRACKETS[0],
    uom: product.uom || STOCK_UNITS[0],
    openingStock: product.openingStock !== undefined ? String(product.openingStock) : "0",
    reorderThreshold: product.reorderThreshold !== undefined ? String(product.reorderThreshold) : "0",
    warehouse: product.warehouse || WAREHOUSES[0],
    rackBay: product.rackBay || "",
    catalogStatus: (product.catalogStatus || "active") as CatalogStatus,
    batchTracking: Boolean(product.batchTracking),
    expiryDate: toDateInput(product.expiryDate),
  };
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </span>
      {children}
    </div>
  );
}

function Section({
  index,
  title,
  subtitle,
  children,
}: {
  index: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3.5 rounded border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex items-start justify-between gap-3 border-b border-outline-variant pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-primary" />
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">{title}</span>
          </div>
          {subtitle ? <p className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">{subtitle}</p> : null}
        </div>
        <span className="rounded bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
          {index}
        </span>
      </div>
      {children}
    </section>
  );
}

export function EditProductModal({ product, onClose, onSaved }: EditProductModalProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(product));
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, saving]);

  const margins = useMemo(() => {
    const cost = Number(String(form.purchasePrice).replace(/,/g, "")) || 0;
    const wholesale = Number(String(form.wholesalePrice).replace(/,/g, "")) || 0;
    const retail = Number(String(form.retailPrice).replace(/,/g, "")) || 0;
    const wholesalePct = cost > 0 ? (((wholesale - cost) / cost) * 100).toFixed(1) : "0.0";
    const retailPct = cost > 0 ? (((retail - cost) / cost) * 100).toFixed(1) : "0.0";
    return { wholesalePct, retailPct, wholesaleAmount: Math.max(0, wholesale - cost) };
  }, [form.purchasePrice, form.wholesalePrice, form.retailPrice]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : "");
    if (file) setRemoveImage(false);
  }

  function undoRemoveImage() {
    setRemoveImage(false);
    setPreview("");
    setImage(null);
  }

  const currentImage = preview || (!removeImage ? product.imageUrl || "" : "");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.sku.trim() || !form.category.trim() || !form.brand.trim()) {
      setError("Please fill required fields: Product Title, SKU, Category, and Brand/Manufacturer.");
      return;
    }

    try {
      setSaving(true);
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (Array.isArray(value)) value.forEach((entry) => body.append(key, String(entry)));
        else body.append(key, String(value));
      });
      body.append("removeImage", removeImage ? "true" : "false");
      if (image) body.append("image", image);

      const res = await apiFetch(`/api/products/${product._id}`, { method: "PUT", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to update product");
      if (!data?.product) throw new Error("Product was updated but the response was empty");

      onSaved(data.product as Product);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close edit product"
        className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px]"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${product.title}`}
        className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded border border-outline-variant bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">edit_note</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Edit Product</h2>
              <span className="rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
                {product.sku}
              </span>
            </div>
            <p className="mt-0.5 font-body-dense text-body-dense text-secondary">
              Update the product record. Changes are saved to MongoDB.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-outline-variant bg-surface-container-lowest text-secondary transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4">
            {error ? (
              <div className="rounded border border-error/30 bg-error-container/30 px-3 py-2 font-body-default text-body-default text-error">
                {error}
              </div>
            ) : null}

            <Section index="SEC #01" title="A. Basic Information" subtitle="Identification, barcode, and catalog classification">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="flex flex-col gap-1.5 lg:col-span-4">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">
                    Product Master Image
                  </span>
                  <div className="relative flex min-h-[180px] flex-col items-center justify-center overflow-hidden rounded border-2 border-dashed border-outline-variant bg-surface-container-low p-3 text-center">
                    <input
                      accept="image/png,image/jpeg"
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      type="file"
                      onChange={onImageChange}
                    />
                    {currentImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentImage} alt={product.title} className="max-h-36 rounded object-contain" />
                    ) : (
                      <>
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-primary">
                          <span className="material-symbols-outlined text-[22px]">add_photo_alternate</span>
                        </div>
                        <div className="font-body-medium text-body-medium text-on-surface">Upload new image</div>
                        <p className="mt-1 max-w-[200px] font-body-dense text-body-dense text-secondary">
                          PNG, JPG up to 5MB. Stored in Cloudinary.
                        </p>
                      </>
                    )}
                  </div>
                  {removeImage ? (
                    <button
                      type="button"
                      onClick={undoRemoveImage}
                      className="flex h-7 items-center justify-center gap-1 rounded border border-outline-variant bg-surface-container-lowest font-body-dense text-body-dense text-primary hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-[14px]">undo</span>
                      Undo remove image
                    </button>
                  ) : image ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
                        setImage(null);
                        setPreview("");
                      }}
                      className="flex h-7 items-center justify-center gap-1 rounded border border-outline-variant bg-surface-container-lowest font-body-dense text-body-dense text-secondary hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                      Clear selected image
                    </button>
                  ) : product.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setPreview("");
                        setRemoveImage(true);
                      }}
                      className="flex h-7 items-center justify-center gap-1 rounded border border-error/30 bg-error-container/20 font-body-dense text-body-dense text-error hover:bg-error-container/40"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Remove image
                    </button>
                  ) : null}
                  <p className="font-mono-data-sm text-mono-data-sm text-secondary">
                    {removeImage
                      ? "Current image will be deleted on save."
                      : image
                        ? product.imageUrl
                          ? "New image will replace the current one on save."
                          : "New image will be uploaded to Cloudinary on save."
                        : product.imageUrl
                          ? "Select a file to replace the current image."
                          : "No image selected."}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-8">
                  <Field label="Product Title" required className="sm:col-span-2">
                    <input
                      value={form.title}
                      onChange={(event) => set("title", event.target.value)}
                      className={inputClass}
                      placeholder="e.g. Dalda Cooking Oil 5L Tin (Case of 4)"
                    />
                  </Field>
                  <Field label="SKU / Item Code" required>
                    <input
                      value={form.sku}
                      onChange={(event) => set("sku", event.target.value.toUpperCase())}
                      className={monoInputClass}
                      placeholder="e.g. DAL-CO-5L"
                    />
                  </Field>
                  <Field label="Barcode / EAN-13">
                    <input
                      value={form.barcode}
                      onChange={(event) => set("barcode", event.target.value)}
                      className={monoInputClass}
                      placeholder="e.g. 8964000124891"
                    />
                  </Field>
                  <Field label="Category" required>
                    <select
                      value={form.category}
                      onChange={(event) => set("category", event.target.value)}
                      className={inputClass}
                    >
                      {PRODUCT_CATEGORIES.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Brand / Manufacturer" required>
                    <input
                      value={form.brand}
                      onChange={(event) => set("brand", event.target.value)}
                      className={inputClass}
                      placeholder="e.g. Dalda Foods Ltd"
                    />
                  </Field>
                </div>
              </div>
              <Field label="Commercial Specs & Invoice Note">
                <textarea
                  value={form.description}
                  onChange={(event) => set("description", event.target.value)}
                  rows={2}
                  className="w-full rounded border border-outline-variant bg-surface-container-lowest p-2.5 font-body-default text-body-default text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
                  placeholder="Packaging, storage, composition, etc."
                />
              </Field>
              <Field label="Available Flavors (Optional)">
                <FlavorInput
                  value={form.flavors}
                  onChange={(flavors) => set("flavors", flavors)}
                />
              </Field>
            </Section>

            <Section index="SEC #02" title="B. Pricing Tiers & FBR Taxation" subtitle="Cost, wholesale, retail, and tax regime">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="1. Purchase Price (Cost)">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={(event) => set("purchasePrice", event.target.value)}
                    className={`${monoInputClass} text-right`}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="2. Wholesale Price (Trade)">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.wholesalePrice}
                    onChange={(event) => set("wholesalePrice", event.target.value)}
                    className={`${monoInputClass} text-right`}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="3. Retail MSRP (Consumer)">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.retailPrice}
                    onChange={(event) => set("retailPrice", event.target.value)}
                    className={`${monoInputClass} text-right`}
                    placeholder="0.00"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 items-center gap-3 rounded border border-outline-variant bg-surface-container p-3 md:grid-cols-12">
                <div className="flex flex-wrap items-center gap-2 font-mono-data text-mono-data md:col-span-7">
                  <span className="rounded border border-[#D1E8DC] bg-[#EBF5F0] px-2.5 py-1 font-semibold text-[#2E7D58]">
                    Wholesale Margin: +{margins.wholesalePct}% (Rs.{" "}
                    {margins.wholesaleAmount.toLocaleString()})
                  </span>
                  <span className="rounded border border-outline-variant bg-surface-container-lowest px-2.5 py-1">
                    MSRP Spread: +{margins.retailPct}%
                  </span>
                </div>
                <Field label="FBR Sales Tax Regime" className="md:col-span-5">
                  <select
                    value={form.taxBracket}
                    onChange={(event) => set("taxBracket", event.target.value)}
                    className={inputClass}
                  >
                    {TAX_BRACKETS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>

            <Section index="SEC #03" title="C. Inventory, Packaging & Warehouse" subtitle="Stock units, depot, and reorder thresholds">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Base Stock Unit (UOM)">
                  <select value={form.uom} onChange={(event) => set("uom", event.target.value)} className={inputClass}>
                    {STOCK_UNITS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Opening Stock">
                  <input
                    type="number"
                    min={0}
                    value={form.openingStock}
                    onChange={(event) => set("openingStock", event.target.value)}
                    className={monoInputClass}
                  />
                </Field>
                <Field label="Reorder Alert Threshold">
                  <input
                    type="number"
                    min={0}
                    value={form.reorderThreshold}
                    onChange={(event) => set("reorderThreshold", event.target.value)}
                    className={monoInputClass}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3 border-t border-outline-variant pt-3 md:grid-cols-2">
                <Field label="Primary Depot Allocation">
                  <select
                    value={form.warehouse}
                    onChange={(event) => set("warehouse", event.target.value)}
                    className={inputClass}
                  >
                    {WAREHOUSES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Storage Bay / Pallet Rack ID">
                  <input
                    value={form.rackBay}
                    onChange={(event) => set("rackBay", event.target.value)}
                    className={monoInputClass}
                    placeholder="e.g. Aisle 4, Bay C-12, Level 2"
                  />
                </Field>
              </div>
            </Section>

            <Section index="SEC #04" title="D. Compliance, Expiry & Catalog Status">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {CATALOG_STATUSES.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2.5 rounded border p-2.5 ${
                      form.catalogStatus === option.value
                        ? "border-primary-container bg-surface-container"
                        : "border-outline-variant bg-surface-container-lowest"
                    }`}
                  >
                    <input
                      type="radio"
                      name="catalog_status"
                      checked={form.catalogStatus === option.value}
                      onChange={() => set("catalogStatus", option.value)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>
                      <span className="block font-body-medium text-body-medium text-on-surface">{option.label}</span>
                      <span className="block font-mono-data-sm text-[11px] text-secondary">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex flex-col gap-2.5 border-t border-outline-variant pt-3">
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={form.batchTracking}
                    onChange={(event) => set("batchTracking", event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-primary"
                  />
                  <span>
                    <span className="block font-body-medium text-body-medium text-on-surface">
                      Enable Strict Batch / Lot Tracking
                    </span>
                    <span className="block font-mono-data-sm text-secondary">For FEFO stock rotation</span>
                  </span>
                </label>
                <Field label="Initial Batch Expiry Date" className="pl-6">
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(event) => set("expiryDate", event.target.value)}
                    className={`${monoInputClass} max-w-xs`}
                  />
                </Field>
              </div>
            </Section>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low px-4 py-2.5">
            <span className="truncate font-mono-data-sm text-mono-data-sm text-secondary">
              ID: {product._id}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex h-[34px] items-center rounded border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface hover:bg-surface-container disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex h-[34px] items-center gap-1.5 rounded bg-primary-container px-4 font-body-medium text-body-medium text-on-primary shadow-sm transition-colors hover:bg-primary disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[17px]">save</span>
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
