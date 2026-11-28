"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "../../lib/api";
import type { StockUnit } from "../../lib/units";
import { BrandSelect, useBrands } from "../../../features/brands";
import {
  appendCanonicalPrices,
  canonicalPriceFromDisplay,
  canonicalPricesFromProduct,
  displayPricesFromCanonical,
  priceUnitFromProduct,
  type CanonicalPrices,
  type PriceField,
} from "../price-fields";
import type { Product } from "../types";
import {
  CATALOG_STATUSES,
  PRODUCT_CATEGORIES,
  STOCK_UNITS,
  WAREHOUSES,
} from "../product-options";

type CatalogStatus = (typeof CATALOG_STATUSES)[number]["value"];

type FormState = {
  title: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  brandId: string;
  description: string;
  purchasePrice: string;
  wholesalePrice: string;
  retailPrice: string;
  priceUnit: StockUnit;
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
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface placeholder:text-outline transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

const monoInputClass =
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data text-on-surface placeholder:text-outline transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildInitialForm(product: Product): FormState {
  const priceUnit = priceUnitFromProduct(product);
  const displayPrices = displayPricesFromCanonical(
    canonicalPricesFromProduct(product),
    priceUnit
  );
  return {
    title: product.title || "",
    sku: product.sku || "",
    barcode: product.barcode || "",
    category: product.category || PRODUCT_CATEGORIES[0],
    brand: product.brand || "",
    brandId: product.brandId || (product.brand ? "legacy" : ""),
    description: product.description || "",
    ...displayPrices,
    priceUnit,
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
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
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
    <section className="flex flex-col gap-4 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3 border-b border-outline-variant pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-primary" />
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">{title}</span>
          </div>
          {subtitle ? <p className="mt-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">{subtitle}</p> : null}
        </div>
        <span className="rounded-lg bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          {index}
        </span>
      </div>
      {children}
    </section>
  );
}

export function EditProductModal({ product, onClose, onSaved }: EditProductModalProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(product));
  const [canonicalPrices, setCanonicalPrices] = useState<CanonicalPrices>(() =>
    canonicalPricesFromProduct(product)
  );
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    brands,
    loading: brandsLoading,
    error: brandsError,
  } = useBrands({ active: false });

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
    const cost = canonicalPrices.purchasePrice ?? 0;
    const wholesale = canonicalPrices.wholesalePrice ?? 0;
    const retail = canonicalPrices.retailPrice ?? 0;
    const wholesalePct = cost > 0 ? (((wholesale - cost) / cost) * 100).toFixed(1) : "0.0";
    const retailPct = cost > 0 ? (((retail - cost) / cost) * 100).toFixed(1) : "0.0";
    return { wholesalePct, retailPct, wholesaleAmount: Math.max(0, wholesale - cost) };
  }, [canonicalPrices]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setPrice(field: PriceField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setCanonicalPrices((current) => ({
      ...current,
      [field]: canonicalPriceFromDisplay(value, form.priceUnit),
    }));
  }

  function setPriceUnit(unit: StockUnit) {
    const display = displayPricesFromCanonical(canonicalPrices, unit);
    setForm((current) => ({ ...current, priceUnit: unit, ...display }));
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

    if (!form.title.trim() || !form.sku.trim() || !form.category.trim()) {
      setError("Please fill required fields: Product Title, SKU, and Category.");
      return;
    }

    try {
      setSaving(true);
      const isLegacyBrand = form.brandId === "legacy";
      const payload: FormState = {
        ...form,
        brandId: isLegacyBrand ? "" : form.brandId,
        brand: isLegacyBrand ? product.brand || "" : "",
      };
      const body = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (Array.isArray(value)) value.forEach((entry) => body.append(key, String(entry)));
        else body.append(key, String(value));
      });
      appendCanonicalPrices(body, canonicalPrices);
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
        className="absolute inset-0 cursor-default bg-inverse-surface/50 backdrop-blur-[2px]"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${product.title}`}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel"
      >
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-5 py-4">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="material-symbols-outlined text-[19px] text-primary">edit_note</span>
              <h2 className="font-headline-md text-headline-md tracking-tight text-on-surface">Edit Product</h2>
              <span className="rounded-lg border border-outline-variant bg-surface-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                {product.sku}
              </span>
            </div>
            <p className="mt-1 font-body-default text-body-default text-on-surface-variant">
              Update the product record. Changes are saved to MongoDB.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition duration-200 hover:bg-row-hover hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
            {error ? (
              <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 font-body-default text-body-default text-error shadow-panel">
                {error}
              </div>
            ) : null}

            <Section index="SEC #01" title="A. Basic Information" subtitle="Identification, barcode, and catalog classification">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="flex flex-col gap-1.5 lg:col-span-4">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                    Product Master Image
                  </span>
                  <div className="relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low p-4 text-center transition duration-200 hover:border-primary-container hover:bg-row-hover">
                    <input
                      accept="image/png,image/jpeg"
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      type="file"
                      onChange={onImageChange}
                    />
                    {currentImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentImage} alt={product.title} className="max-h-40 rounded-lg object-contain shadow-panel" />
                    ) : (
                      <>
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-high text-primary">
                          <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                        </div>
                        <div className="font-body-medium text-body-medium text-on-surface">Upload new image</div>
                        <p className="mt-1.5 max-w-[220px] font-body-dense text-body-dense text-on-surface-variant">
                          PNG, JPG up to 5MB. Stored in Cloudinary.
                        </p>
                      </>
                    )}
                  </div>
                  {removeImage ? (
                    <button
                      type="button"
                      onClick={undoRemoveImage}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default text-body-default text-primary transition duration-200 hover:border-border hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                      className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface-variant transition duration-200 hover:border-border hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                      className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-error/30 bg-error-container/20 px-3 font-body-default text-body-default text-error transition duration-200 hover:bg-error-container/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Remove image
                    </button>
                  ) : null}
                  <p className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8">
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
                  <BrandSelect
                    value={form.brandId}
                    onChange={(brandId) => {
                      const selected = brands.find((brand) => brand._id === brandId);
                      setForm((current) => ({
                        ...current,
                        brandId,
                        brand:
                          brandId === "legacy"
                            ? product.brand || ""
                            : selected?.name || "",
                      }));
                    }}
                    brands={brands}
                    loading={brandsLoading}
                    error={brandsError}
                    inputClassName={inputClass}
                    legacyBrand={product.brandId ? undefined : product.brand || undefined}
                    includeInactiveIds={product.brandId ? [product.brandId] : []}
                  />
                </div>
              </div>
              <Field label="Commercial Specs & Invoice Note">
                <textarea
                  value={form.description}
                  onChange={(event) => set("description", event.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 font-body-default text-body-default leading-relaxed text-on-surface placeholder:text-outline transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Packaging, storage, composition, etc."
                />
              </Field>
            </Section>

            <Section index="SEC #02" title="B. Pricing Tiers" subtitle="Cost, wholesale, and retail pricing">
              <Field label="Price Entry Unit" className="md:max-w-sm">
                <select
                  value={form.priceUnit}
                  onChange={(event) => setPriceUnit(event.target.value as StockUnit)}
                  className={inputClass}
                >
                  {STOCK_UNITS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                  All prices below are converted and stored per Piece.
                </span>
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label={`1. Purchase Price (Cost) / ${form.priceUnit}`}>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={(event) => setPrice("purchasePrice", event.target.value)}
                    className={`${monoInputClass} text-right`}
                    placeholder="0.00"
                  />
                </Field>
                <Field label={`2. Wholesale Price (Trade) / ${form.priceUnit}`}>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.wholesalePrice}
                    onChange={(event) => setPrice("wholesalePrice", event.target.value)}
                    className={`${monoInputClass} text-right`}
                    placeholder="0.00"
                  />
                </Field>
                <Field label={`3. Retail MSRP (Consumer) / ${form.priceUnit}`}>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.retailPrice}
                    onChange={(event) => setPrice("retailPrice", event.target.value)}
                    className={`${monoInputClass} text-right`}
                    placeholder="0.00"
                  />
                </Field>
              </div>
              <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                <div className="flex flex-wrap items-center gap-2 font-mono-data text-mono-data">
                  <span className="rounded-lg border border-primary/20 bg-primary-fixed/20 px-3 py-1.5 font-semibold text-primary">
                    Wholesale Margin: +{margins.wholesalePct}% (Rs.{" "}
                    {margins.wholesaleAmount.toLocaleString()} / Piece)
                  </span>
                  <span className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5">
                    MSRP Spread: +{margins.retailPct}%
                  </span>
                </div>
              </div>
            </Section>

            <Section index="SEC #03" title="C. Inventory, Packaging & Warehouse" subtitle="Stock units, depot, and reorder thresholds">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Base Stock Unit (UOM)">
                  <select value={form.uom} onChange={(event) => set("uom", event.target.value)} className={inputClass}>
                    {STOCK_UNITS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Opening Stock (Base Pieces)">
                  <input
                    type="number"
                    min={0}
                    value={form.openingStock}
                    onChange={(event) => set("openingStock", event.target.value)}
                    className={monoInputClass}
                  />
                  <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Stored as pieces. 1 Carton = 24 pcs, 1 Box = 12 pcs.</span>
                </Field>
                <Field label="Reorder Alert Threshold (Pieces)" required>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.reorderThreshold}
                    onChange={(event) => set("reorderThreshold", event.target.value)}
                    className={monoInputClass}
                  />
                  <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">Alert below this number of pieces.</span>
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 border-t border-outline-variant pt-4 md:grid-cols-2">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {CATALOG_STATUSES.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition duration-200 hover:border-border ${
                      form.catalogStatus === option.value
                        ? "border-primary-container bg-primary-fixed/20"
                        : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
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
                      <span className="block font-mono-data-sm text-mono-data-sm text-on-surface-variant">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-outline-variant pt-4">
                <label className="flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3">
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
                    <span className="block font-mono-data-sm text-mono-data-sm text-on-surface-variant">For FEFO stock rotation</span>
                  </span>
                </label>
                <Field label="Initial Batch Expiry Date" className="pl-7">
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low px-5 py-3">
            <span className="truncate font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              ID: {product._id}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex h-9 items-center rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex h-9 items-center gap-2 rounded-lg bg-primary px-5 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px active:bg-primary-hover/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
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
