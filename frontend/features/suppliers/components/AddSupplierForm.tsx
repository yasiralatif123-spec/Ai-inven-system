"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  GRACE_DAY_OPTIONS,
  HUB_OPTIONS,
  PAYMENT_TERM_OPTIONS,
  TAX_STATUS_OPTIONS,
} from "../constants";
import {
  createSupplier,
  fetchNextSupplierCode,
} from "../services/supplier.service";
import type { CreateSupplierInput, HubKey, PaymentTerms, TaxStatus } from "../types";
import { useSupplierProducts } from "../hooks/useSupplierProducts";
import { ProductMultiSelect } from "./ProductMultiSelect";

const EMPTY_FORM: CreateSupplierInput = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  hub: "",
  taxStatus: "standard",
  address: "",
  ntn: "",
  paymentTerms: "net-15",
  openingBalance: 0,
  graceDays: 5,
  notes: "",
  productIds: [],
};

const INPUT_CLASS =
  "h-[34px] w-full rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60";
const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer appearance-none pr-9`;
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 py-2 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60";

type FieldProps = {
  label: ReactNode;
  hint?: string;
  children: ReactNode;
};

function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 font-body-medium text-body-medium text-on-surface">
        {label}
      </label>
      {children}
      {hint ? (
        <span className="font-body-dense text-body-dense text-on-surface-variant">{hint}</span>
      ) : null}
    </div>
  );
}

function SectionCard({
  number,
  title,
  description,
  badge,
  children,
}: {
  number: string;
  title: string;
  description: string;
  badge: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/80 bg-surface-container-low px-6 py-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {number}. {title}
          </h2>
          <p className="mt-0.5 font-body-dense text-body-dense text-on-surface-variant">
            {description}
          </p>
        </div>
        {badge}
      </div>
      <div className="flex flex-col gap-5 p-6">{children}</div>
    </section>
  );
}

export function AddSupplierForm() {
  const router = useRouter();
  const [form, setForm] = useState<CreateSupplierInput>(EMPTY_FORM);
  const [nextCode, setNextCode] = useState("S-208");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useSupplierProducts();

  const shouldReset = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCode() {
      try {
        const code = await fetchNextSupplierCode();
        if (!cancelled) setNextCode(code);
      } catch {
        if (!cancelled) setNextCode("S-208");
      }
    }

    loadCode();
    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setForm({ ...EMPTY_FORM, productIds: [] });
    setError(null);
    setSuccess(null);
  }

  function update<K extends keyof CreateSupplierInput>(key: K, value: CreateSupplierInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
    setSuccess(null);
  }

  function handleProductIdsChange(ids: string[]) {
    setForm((current) => ({
      ...current,
      productIds: ids,
    }));
    setError(null);
    setSuccess(null);
  }

  async function save(addAnother = false) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await createSupplier(form);
      // Mark a successful submit so the Activity cleanup can clear stale messages
      // when navigation hides this page.
      shouldReset.current = true;
      if (addAnother) {
        resetForm();
        setSuccess(`${created.name} registered as #${created.code}. Ready for the next supplier.`);
        setNextCode(await fetchNextSupplierCode());
      } else {
        // Reset before navigating so the hidden page is preserved with empty fields;
        // reopening it from the list then shows a fresh form without a refresh.
        resetForm();
        router.push("/suppliers");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to register the supplier. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(false);
  }

  // Activity hides (rather than unmounts) this page on navigation, so a stale
  // success/error message would otherwise reappear the next time it is opened.
  useLayoutEffect(() => {
    return () => {
      if (shouldReset.current) {
        shouldReset.current = false;
        setError(null);
        setSuccess(null);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          <span>Wholesale Operations</span>
          <span className="text-outline-variant">/</span>
          <button
            type="button"
            onClick={() => router.push("/suppliers")}
            className="transition duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Supplier Directory
          </button>
          <span className="text-outline-variant">/</span>
          <span className="font-medium text-on-surface">New Supplier</span>
        </nav>
        <div className="flex items-center gap-2 rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          Auto-Allocated Code:{" "}
          <strong className="font-mono-data font-semibold text-primary">{nextCode}</strong>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/80 pb-6">
        <div className="flex max-w-2xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
              Add Supplier
            </h1>
            <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-label-caps text-label-caps uppercase tracking-wider text-primary">
              Payables Registration
            </span>
          </div>
          <p className="font-body-default text-body-default text-on-surface-variant">
            Register a new wholesale distributor or manufacturer, set settlement terms, and configure
            opening payables.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setError("CSV import is not connected yet.")}
            className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
              upload_file
            </span>
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => router.push("/suppliers")}
            className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
              format_list_bulleted
            </span>
            View Supplier List
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-error/20 bg-error-container/50 px-3.5 py-2.5 font-body-dense text-body-dense text-error">
          <span className="material-symbols-outlined text-[17px]">error_outline</span>
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-primary-container/40 bg-primary-container/20 px-3.5 py-2.5 font-body-dense text-body-dense text-primary">
          <span className="material-symbols-outlined text-[17px]">check_circle</span>
          {success}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="mx-auto flex w-full max-w-4xl flex-col gap-6"
        id="add-supplier-form"
      >
        <SectionCard
          number="1"
          title="Company Information"
          description="Primary corporate entity, commercial contact authority, and warehouse dispatch address."
          badge={
            <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              Entity Core
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
            <Field
              label={
                <span>
                  Supplier / Company Name <span className="text-error">*</span>
                </span>
              }
              hint="Registered business name as appearing on sales tax invoices."
            >
              <input
                className={INPUT_CLASS}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="e.g., Dalda Foods Agency or National Foods Distributor"
                required
                type="text"
              />
            </Field>

            <Field
              label={
                <span>
                  Contact Person <span className="text-error">*</span>
                </span>
              }
              hint="Authorized representative for bookings and order confirmation."
            >
              <input
                className={INPUT_CLASS}
                value={form.contactPerson}
                onChange={(event) => update("contactPerson", event.target.value)}
                placeholder="Muhammad Tariq Farooq (Key Accounts Manager)"
                required
                type="text"
              />
            </Field>

            <Field
              label={
                <span>
                  Phone Number <span className="text-error">*</span>
                </span>
              }
              hint="Primary landline or mobile for delivery coordination."
            >
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-2.5 select-none font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                  +92
                </span>
                <input
                  className={`${INPUT_CLASS} pl-11 font-mono-data`}
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="42 37661204 / 300 1234567"
                  required
                  type="tel"
                />
              </div>
            </Field>

            <Field
              label={
                <>
                  <span>Email Address</span>
                  <span className="font-mono-data-sm font-normal text-on-surface-variant">(Optional)</span>
                </>
              }
              hint="Automated dispatch for purchase orders and payment remittances."
            >
              <input
                className={INPUT_CLASS}
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="dispatch@dalda-agency.pk"
                type="email"
              />
            </Field>

            <Field
              label={
                <>
                  <span>Distribution Hub / City</span>
                  <span className="font-mono-data-sm font-normal text-on-surface-variant">(Optional)</span>
                </>
              }
              hint="Transit origin calculating estimated freight timeline."
            >
              <div className="relative flex items-center">
                <select
                  className={SELECT_CLASS}
                  value={form.hub}
                  onChange={(event) => update("hub", event.target.value as HubKey)}
                >
                  {HUB_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 text-[18px] text-on-surface-variant">
                  expand_more
                </span>
              </div>
            </Field>

            <Field
              label={
                <>
                  <span>Tax Exemption Status</span>
                  <span className="font-mono-data-sm font-normal text-on-surface-variant">(Optional)</span>
                </>
              }
              hint="Applies automated withholding deductions at voucher posting."
            >
              <div className="relative flex items-center">
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
                <span className="material-symbols-outlined pointer-events-none absolute right-3 text-[18px] text-on-surface-variant">
                  expand_more
                </span>
              </div>
            </Field>
          </div>

          <Field
            label={
              <span>
                Warehouse / Dispatch Address <span className="text-error">*</span>
              </span>
            }
            hint="Standard dispatch and goods receipt note (GRN) pickup location."
          >
            <textarea
              className={`${TEXTAREA_CLASS} min-h-[76px] resize-y`}
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
              placeholder="Plot #24-B, Badami Bagh Industrial Area, Lahore"
              required
              rows={3}
            />
          </Field>

          <Field
            label={
              <>
                <span>Supplied Products</span>
                <span className="font-mono-data-sm font-normal text-on-surface-variant">(Optional)</span>
              </>
            }
            hint="Search and select products from the catalog that this supplier can fulfil."
          >
            <ProductMultiSelect
              selectedIds={form.productIds}
              onChange={handleProductIdsChange}
              products={products}
              loading={productsLoading}
              error={productsError}
            />
          </Field>
        </SectionCard>

        <SectionCard
          number="2"
          title="Tax and Accounts"
          description="FBR NTN registration, opening payable obligations, and settlement credit terms."
          badge={
            <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm font-semibold text-primary">
              Ledger Code: {nextCode}
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
            <Field
              label={
                <>
                  <span>Tax Information / NTN</span>
                  <span className="font-mono-data-sm font-normal text-on-surface-variant">(Optional)</span>
                </>
              }
              hint="National Tax Number or Sales Tax Registration Number."
            >
              <input
                className={`${INPUT_CLASS} font-mono-data`}
                value={form.ntn}
                onChange={(event) => update("ntn", event.target.value)}
                placeholder="e.g. 2489102-7 or STRN 17-00-9876-543-12"
                type="text"
              />
            </Field>

            <Field
              label={
                <span>
                  Payment Terms <span className="text-error">*</span>
                </span>
              }
              hint="Default credit aging calculation starts from GRN confirmation date."
            >
              <div className="relative flex items-center">
                <select
                  className={SELECT_CLASS}
                  value={form.paymentTerms}
                  onChange={(event) => update("paymentTerms", event.target.value as PaymentTerms)}
                  required
                >
                  {PAYMENT_TERM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 text-[18px] text-on-surface-variant">
                  expand_more
                </span>
              </div>
            </Field>

            <Field
              label={
                <>
                  <span>Opening Balance (PKR)</span>
                  <span className="font-mono-data-sm font-normal text-on-surface-variant">(Optional)</span>
                </>
              }
              hint="Amount you already owe this supplier before using StockFlow (entered as Credit/Payable)."
            >
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-2.5 select-none font-mono-data-sm text-mono-data-sm font-medium text-on-surface-variant">
                  Rs.
                </span>
                <input
                  className={`${INPUT_CLASS} pl-10 pr-2.5 text-right font-mono-data`}
                  value={form.openingBalance || ""}
                  onChange={(event) =>
                    update("openingBalance", Math.max(0, Number(event.target.value) || 0))
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  type="number"
                />
              </div>
            </Field>

            <Field
              label={
                <>
                  <span>Credit Period Grace Days</span>
                  <span className="font-mono-data-sm font-normal text-on-surface-variant">(Optional)</span>
                </>
              }
              hint="Buffer allowed before purchase invoice triggers payment overdue alert."
            >
              <div className="relative flex items-center">
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
                <span className="material-symbols-outlined pointer-events-none absolute right-3 text-[18px] text-on-surface-variant">
                  expand_more
                </span>
              </div>
            </Field>
          </div>

          <div className="mt-2 flex items-start gap-3 rounded-lg border border-outline-variant/80 bg-surface-container p-4">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-container/15">
              <span className="material-symbols-outlined text-[17px] text-primary">verified</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-body-medium text-body-medium font-medium text-on-surface">
                Automated Payables Guarantee
              </span>
              <p className="font-body-dense text-body-dense leading-relaxed text-on-surface-variant">
                Registering this supplier initializes an immutable accounts payable sub-ledger under{" "}
                <strong className="font-medium text-on-surface">
                  Current Liabilities &gt; Trade Creditors
                </strong>
                . All transactions adhere to standard mercantile double-entry accounting.
              </p>
            </div>
          </div>
        </SectionCard>

        <section className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/80 bg-surface-container-low px-6 py-4">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                3. Notes &amp; Trade Terms
              </h2>
              <p className="mt-0.5 font-body-dense text-body-dense text-on-surface-variant">
                Special procurement arrangements, distributor rebate slabs, and delivery schedules.
              </p>
            </div>
            <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              (Optional)
            </span>
          </div>
          <div className="p-6">
            <Field
              label={
                <>
                  <span>Procurement Notes &amp; Delivery Guarantees</span>
                  <span className="font-mono-data-sm font-normal text-on-surface-variant">(Optional)</span>
                </>
              }
              hint="Internal procurement remarks are strictly confidential and will not appear on vendor POs."
            >
              <textarea
                className={`${TEXTAREA_CLASS} min-h-[76px] resize-y`}
                value={form.notes}
                onChange={(event) => update("notes", event.target.value.slice(0, 500))}
                placeholder="e.g. 2.5% prompt payment rebate on settling within 7 days. Bi-weekly delivery via Bilty on Wednesdays."
                maxLength={500}
                rows={3}
              />
              <div className="mt-0.5 flex items-center justify-between">
                <span className="font-body-dense text-body-dense text-on-surface-variant">
                  Internal procurement remarks are strictly confidential and will not appear on
                  vendor POs.
                </span>
                <span className="rounded-md bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                  Max 500 characters
                </span>
              </div>
            </Field>
          </div>
        </section>

        <div className="sticky bottom-0 z-30 -mx-6 flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/80 bg-surface-container-lowest/95 px-6 py-3.5 shadow-[0_-4px_16px_rgba(38,50,56,0.08)] backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary"></div>
            <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              New supplier record will generate Master Vendor Account{" "}
              <strong className="font-mono-data text-on-surface">#{nextCode}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/suppliers")}
              disabled={saving}
              className="h-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save(true)}
              disabled={saving}
              className="h-9 rounded-lg border border-outline-variant bg-surface-container px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:bg-surface-container-high active:translate-y-px disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Save &amp; Add Another
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-5 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px active:bg-primary-hover/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="material-symbols-outlined text-[17px]">
                {saving ? "progress_activity" : "save"}
              </span>
              {saving ? "Registering…" : "Save Supplier"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
