"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  GRACE_DAY_OPTIONS,
  HUB_OPTIONS,
  PAYMENT_TERM_OPTIONS,
  TAX_STATUS_OPTIONS,
} from "../constants";
import { updateSupplier } from "../services/supplier.service";
import { useSupplierProducts } from "../hooks/useSupplierProducts";
import { ProductMultiSelect } from "./ProductMultiSelect";
import type {
  HubKey,
  PaymentTerms,
  Supplier,
  TaxStatus,
  UpdateSupplierInput,
} from "../types";
import { formatRs } from "../utils";

type EditSupplierDialogProps = {
  supplier: Supplier;
  onClose: () => void;
  onSaved: (supplier: Supplier) => void;
};

const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container";
const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer appearance-none pr-9`;
const TEXTAREA_CLASS =
  "w-full resize-none rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 py-2 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container";

function toInput(supplier: Supplier): UpdateSupplierInput {
  const productIds = supplier.productIds || [];
  return {
    name: supplier.name,
    contactPerson: supplier.contact,
    phone: supplier.phone,
    email: supplier.email,
    hub: supplier.hubKey,
    taxStatus: supplier.taxStatus,
    address: supplier.address,
    ntn: supplier.ntn,
    paymentTerms: supplier.paymentTerms,
    graceDays: supplier.graceDays,
    notes: supplier.notes,
    productIds,}
  };


function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-2 text-[18px] text-on-surface-variant">
        expand_more
      </span>
    </div>
  );
}

export function EditSupplierDialog({ supplier, onClose, onSaved }: EditSupplierDialogProps) {
  const [form, setForm] = useState<UpdateSupplierInput>(() => toInput(supplier));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useSupplierProducts();

  const catalogIds = useMemo(
    () => new Set(products.map((product) => product._id)),
    [products]
  );
  const selectedProductIds = useMemo(() => {
    if (products.length === 0) return form.productIds;
    return form.productIds.filter((id) => catalogIds.has(id));
  }, [catalogIds, form.productIds, products.length]);
  const staleProductCount = form.productIds.length - selectedProductIds.length;

  function update<K extends keyof UpdateSupplierInput>(key: K, value: UpdateSupplierInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function handleProductIdsChange(ids: string[]) {
    setForm((current) => ({
      ...current,
      productIds: ids,
    }));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Supplier name is required");
      return;
    }
    if (!form.contactPerson.trim()) {
      setError("Contact person is required");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid phone number with at least 10 digits");
      return;
    }
    if (!form.address.trim()) {
      setError("Warehouse address is required");
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    if (!form.paymentTerms) {
      setError("Payment terms is required");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateSupplier(supplier.id, {
        ...form,
        productIds: selectedProductIds,
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        ntn: form.ntn.trim(),
        notes: form.notes.trim(),
      });
      onSaved(updated);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update supplier. Please try again."
      );
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-supplier-title"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel"
      >
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant/80 bg-surface-container-low px-5 py-4">
          <div>
            <h2 id="edit-supplier-title" className="font-headline-md text-headline-md text-on-surface">
              Edit Supplier
            </h2>
            <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              #{supplier.code} · opening balance {formatRs(supplier.openingBalance)} and payable
              totals are preserved
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit supplier form"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition duration-200 hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Supplier / Company Name">
              <input
                className={INPUT_CLASS}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              />
            </Field>
            <Field label="Contact Person">
              <input
                className={INPUT_CLASS}
                value={form.contactPerson}
                onChange={(event) => update("contactPerson", event.target.value)}
              />
            </Field>
            <Field label="Phone (+92)">
              <input
                className={`${INPUT_CLASS} font-mono-data`}
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
            </Field>
            <Field label="Dispatch Email">
              <input
                className={INPUT_CLASS}
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </Field>
            <Field label="Primary Supply Hub">
              <SelectShell>
                <select
                  className={SELECT_CLASS}
                  value={form.hub}
                  onChange={(event) => update("hub", event.target.value as HubKey)}
                >
                  {HUB_OPTIONS.map((option) => (
                    <option key={option.value || "none"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </Field>
            <Field label="FBR Tax Status">
              <SelectShell>
                <select
                  className={SELECT_CLASS}
                  value={form.taxStatus}
                  onChange={(event) => update("taxStatus", event.target.value as TaxStatus)}
                >
                  {TAX_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Warehouse / Dispatch Address">
                <textarea
                  className={TEXTAREA_CLASS}
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  rows={2}
                />
              </Field>
            </div>
            <Field label="NTN / STRN">
              <input
                className={`${INPUT_CLASS} font-mono-data uppercase`}
                value={form.ntn}
                onChange={(event) => update("ntn", event.target.value)}
              />
            </Field>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Payment Terms">
              <SelectShell>
                <select
                  className={SELECT_CLASS}
                  value={form.paymentTerms}
                  onChange={(event) => update("paymentTerms", event.target.value as PaymentTerms)}
                >
                  {PAYMENT_TERM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </Field>
            <Field label="Grace Days">
              <SelectShell>
                <select
                  className={SELECT_CLASS}
                  value={form.graceDays}
                  onChange={(event) => update("graceDays", Number(event.target.value))}
                >
                  {GRACE_DAY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Procurement Notes">
                <textarea
                  className={TEXTAREA_CLASS}
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value.slice(0, 500))}
                  rows={2}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Supplied Products">
                <div className="flex flex-col gap-1">
                  <ProductMultiSelect
                    selectedIds={selectedProductIds}                    onChange={handleProductIdsChange}                    products={products}
                    loading={productsLoading}
                    error={productsError}
                  />
                  {staleProductCount > 0 ? (
                    <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1.5 font-body-dense text-body-dense text-on-surface-variant">
                      {staleProductCount} product link
                      {staleProductCount === 1 ? "" : "s"} no longer in the catalog will be removed
                      when you save.
                    </span>
                  ) : null}
                </div>
              </Field>
            </div>
          </section>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-error/20 bg-error-container/50 px-3 py-2 font-body-dense text-body-dense text-error">
              <span className="material-symbols-outlined text-[16px]">error_outline</span>
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-outline-variant/80 bg-surface-container-low px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-outline hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-lg bg-primary-container px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary active:translate-y-px disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
