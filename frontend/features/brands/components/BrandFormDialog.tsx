"use client";

import { useEffect, useState } from "react";
import {
  BRAND_DESCRIPTION_MAX_LENGTH,
  BRAND_NAME_MAX_LENGTH,
} from "../constants";
import { createBrand, updateBrand } from "../services/brand.service";
import type { Brand, CreateBrandInput } from "../types";
import { normalizeBrandName, validateBrandInput } from "../utils";

type BrandFormDialogProps = {
  brand: Brand | null;
  brands: Brand[];
  onClose: () => void;
  onSaved: (brand: Brand, mode: "created" | "updated") => void;
};

const inputClass =
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface placeholder:text-outline transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

export function BrandFormDialog({
  brand,
  brands,
  onClose,
  onSaved,
}: BrandFormDialogProps) {
  const [form, setForm] = useState<CreateBrandInput>({
    name: brand?.name || "",
    description: brand?.description || "",
    isActive: brand ? brand.isActive : true,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, saving]);

  function update<K extends keyof CreateBrandInput>(key: K, value: CreateBrandInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validateBrandInput(form, brands, brand?._id);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      const payload: CreateBrandInput = {
        name: normalizeBrandName(form.name),
        description: (form.description || "").trim(),
        isActive: form.isActive !== false,
      };
      const saved = brand
        ? await updateBrand(brand._id, payload)
        : await createBrand(payload);
      onSaved(saved, brand ? "updated" : "created");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save brand"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close brand form"
        className="absolute inset-0 cursor-default bg-inverse-surface/50 backdrop-blur-[2px]"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-form-title"
        className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel"
      >
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[19px] text-primary">
                {brand ? "edit_note" : "add"}
              </span>
              <h2 id="brand-form-title" className="font-headline-md text-headline-md tracking-tight text-on-surface">
                {brand ? "Edit Brand" : "Add Brand"}
              </h2>
            </div>
            <p className="font-body-default text-body-default text-on-surface-variant">
              {brand
                ? "Update brand details and availability."
                : "Create a reusable brand for your product catalog."}
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
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
            {error ? (
              <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 font-body-default text-body-default text-error shadow-panel">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface" htmlFor="brand-name">
                Brand Name <span className="text-error">*</span>
              </label>
              <input
                id="brand-name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                maxLength={BRAND_NAME_MAX_LENGTH}
                className={inputClass}
                placeholder="e.g. Dalda Foods Ltd"
                autoFocus
              />
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                {form.name.trim().length}/{BRAND_NAME_MAX_LENGTH}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface" htmlFor="brand-description">
                Description
              </label>
              <textarea
                id="brand-description"
                value={form.description || ""}
                onChange={(event) => update("description", event.target.value)}
                maxLength={BRAND_DESCRIPTION_MAX_LENGTH}
                rows={3}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 font-body-default leading-relaxed text-on-surface placeholder:text-outline transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Optional notes about this brand"
              />
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                {(form.description || "").trim().length}/{BRAND_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface" htmlFor="brand-status">
                Status
              </label>
              <select
                id="brand-status"
                value={form.isActive === false ? "inactive" : "active"}
                onChange={(event) => update("isActive", event.target.value === "active")}
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <span className="font-body-dense text-body-dense text-on-surface-variant">
                Inactive brands are hidden from new product selection but remain visible on existing products.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-outline-variant bg-surface-container-low px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 items-center rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-medium text-body-medium text-on-surface transition duration-200 hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px]">check_circle</span>
              {saving ? "Saving..." : brand ? "Save Changes" : "Create Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
