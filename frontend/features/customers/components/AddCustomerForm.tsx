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
  CITY_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  ROUTE_OPTIONS,
  STATUS_OPTIONS,
} from "../constants";
import { createCustomer, fetchNextCustomerCode } from "../services/customer.service";
import { isValidCustomerPhone } from "../utils";
import type {
  City,
  CreateCustomerInput,
  CustomerRoute,
  CustomerStatus,
  CustomerType,
} from "../types";

const EMPTY_FORM: CreateCustomerInput = {
  name: "",
  businessName: "",
  phone: "",
  altPhone: "",
  email: "",
  city: "Lahore",
  address: "",
  customerType: "Wholesale",
  status: "Active",
  route: "lahore-central",
  ntn: "",
  creditLimit: 0,
  paymentTerms: "15days",
  openingBalance: 0,
  gracePeriod: "none",
  notes: "",
};

const INPUT_CLASS =
  "h-[34px] w-full rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60";
const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer appearance-none pr-9`;
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 py-2 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60";

function Field({ label, hint, children }: { label: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center justify-between font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
        {label}
      </label>
      {children}
      {hint ? (
        <span className="font-body-dense text-body-dense text-on-surface-variant">{hint}</span>
      ) : null}
    </div>
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
    <section className="flex flex-col gap-6 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-panel">
      <div className="flex flex-col gap-2 border-b border-outline-variant/80 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
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
      {children}
    </section>
  );
}

export function AddCustomerForm() {
  const router = useRouter();
  const [form, setForm] = useState<CreateCustomerInput>(EMPTY_FORM);
  const [nextCode, setNextCode] = useState("C-410");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldReset = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCode() {
      try {
        const code = await fetchNextCustomerCode();
        if (!cancelled) setNextCode(code);
      } catch {
        if (!cancelled) setNextCode("C-410");
      }
    }

    loadCode();
    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setError(null);
  }

  function update<K extends keyof CreateCustomerInput>(key: K, value: CreateCustomerInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Full name is required");
      return;
    }
    if (!form.businessName.trim()) {
      setError("Business / trade title is required");
      return;
    }
    if (!isValidCustomerPhone(form.phone)) {
      setError("Enter a valid 11-digit mobile or PTCL number");
      return;
    }
    if (form.altPhone.trim() && !isValidCustomerPhone(form.altPhone)) {
      setError("Enter a valid alternate phone number");
      return;
    }
    if (!form.address.trim()) {
      setError("Physical dispatch address is required");
      return;
    }
    if (form.address.trim().length > 300) {
      setError("Physical dispatch address cannot exceed 300 characters");
      return;
    }

    const payload: CreateCustomerInput = {
      ...form,
      name: form.name.trim(),
      businessName: form.businessName.trim(),
      address: form.address.trim(),
      ntn: form.ntn.trim(),
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      await createCustomer(payload);
      // Reset before navigating so the hidden page is preserved with empty fields;
      // reopening it from the list then shows a fresh form without a refresh.
      resetForm();
      shouldReset.current = true;
      router.push("/customers");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save the customer. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // Activity hides (rather than unmounts) this page on navigation, so a stale
  // error message would otherwise reappear the next time it is opened.
  useLayoutEffect(() => {
    return () => {
      if (shouldReset.current) {
        shouldReset.current = false;
        setError(null);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex flex-col gap-4 border-b border-outline-variant/80 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            <span>Wholesale Operations</span>
            <span className="text-outline-variant">/</span>
            <button
              type="button"
              onClick={() => router.push("/customers")}
              className="transition duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Customer Accounts
            </button>
            <span className="text-outline-variant">/</span>
            <span className="font-medium text-on-surface">New Customer</span>
          </nav>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
              Add Customer
            </h1>
            <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-label-caps text-label-caps uppercase tracking-wider text-primary">
              Ledger Registration
            </span>
          </div>
          <p className="max-w-2xl font-body-default text-body-default text-on-surface-variant">
            Create a new wholesale or retail account with its classification, delivery route, and
            ledger reference.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-end">
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
            onClick={() => router.push("/customers")}
            className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
              format_list_bulleted
            </span>
            View Customer List
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-error/20 bg-error-container/50 px-3.5 py-2.5 font-body-dense text-body-dense text-error">
          <span className="material-symbols-outlined text-[17px]">error_outline</span>
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        id="add-customer-form"
        className="mx-auto mt-1 flex w-full max-w-5xl flex-col gap-8"
        noValidate
      >
        <SectionCard
          number="1"
          title="Basic Information"
          description="Primary legal trading entities, contact authority, and commercial delivery address."
          badge={
            <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              * Required for invoice generation
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label={
                <span>
                  Full Name <span className="font-bold text-error">*</span>
                </span>
              }
              hint="Authorized signature & receiving contact"
            >
              <input
                className={INPUT_CLASS}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="e.g. Tariq Mehmood"
              />
            </Field>

            <Field
              label={
                <span>
                  Business / Trade Title <span className="font-bold text-error">*</span>
                </span>
              }
              hint="Will appear on ledger manifests, billings, and e-invoices"
            >
              <input
                className={INPUT_CLASS}
                value={form.businessName}
                onChange={(event) => update("businessName", event.target.value)}
                placeholder="e.g. Zubair Traders or Madina Supermarket"
              />
            </Field>

            <Field
              label={
                <span>
                  Primary Phone Number <span className="font-bold text-error">*</span>
                </span>
              }
              hint="Enter a valid 11-digit mobile or PTCL number"
            >
              <div className="relative">
                <input
                  className={`${INPUT_CLASS} font-mono-data`}
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="+92 300 1234567"
                  type="tel"
                />
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-2 text-[18px] text-on-surface-variant">
                  call
                </span>
              </div>
            </Field>

            <Field label="Email Address" hint="Optional — for invoices and weekly statements">
              <input
                className={INPUT_CLASS}
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="accounts@business.pk"
                type="email"
              />
            </Field>

            <Field
              label={
                <span>
                  Commercial Hub / City <span className="font-bold text-error">*</span>
                </span>
              }
              hint="Defines routing and freight zoning for this account"
            >
              <SelectShell>
                <select
                  className={SELECT_CLASS}
                  value={form.city}
                  onChange={(event) => update("city", event.target.value as City)}
                >
                  {CITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </Field>

            <Field label="Alternate Phone / WhatsApp" hint="Optional — gate-pass & payment alerts">
              <input
                className={`${INPUT_CLASS} font-mono-data`}
                value={form.altPhone}
                onChange={(event) => update("altPhone", event.target.value)}
                placeholder="+92 321 9876543"
              />
            </Field>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Field
                label={
                  <span>
                    Physical Dispatch & Billing Address <span className="font-bold text-error">*</span>
                  </span>
                }
              >
                <textarea
                  className={`${TEXTAREA_CLASS} resize-none`}
                  value={form.address}
                  onChange={(event) => update("address", event.target.value.slice(0, 300))}
                  placeholder="Shop / Warehouse #, Floor, Commercial Plaza / Road, Mandi / Market Area..."
                  rows={3}
                />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                <span>Standard delivery manifest location printed on bilty & gate pass</span>
                <span className="rounded-md bg-surface-container px-2 py-0.5 text-on-surface-variant">
                  Max 300 chars
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          number="2"
          title="Customer Classification & Operations"
          description="Tier grouping, active account state, and logistics route attribution."
          badge={
            <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              Tier & Account Setup
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label={
                <span>
                  Customer Classification <span className="font-bold text-error">*</span>
                </span>
              }
              hint="Determines wholesale tiered price schedules at point of sale"
            >
              <SelectShell>
                <select
                  className={`${SELECT_CLASS} font-medium`}
                  value={form.customerType}
                  onChange={(event) => update("customerType", event.target.value as CustomerType)}
                >
                  {CUSTOMER_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </Field>

            <Field
              label={
                <span>
                  Account Status <span className="font-bold text-error">*</span>
                </span>
              }
              hint="Inactive or blocked accounts cannot generate new quotations or release orders"
            >
              <div className="grid h-9 grid-cols-3 gap-2 rounded-lg border border-outline-variant/80 bg-surface-container p-1">
                {STATUS_OPTIONS.map((option) => {
                  const active = form.status === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer select-none items-center justify-center rounded-md px-2 transition duration-200 ${
                        active
                          ? "border border-primary-container bg-surface-container-lowest text-primary shadow-sm"
                          : "border border-transparent text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      <input
                        type="radio"
                        name="account_status"
                        value={option.value}
                        checked={active}
                        onChange={() => update("status", option.value as CustomerStatus)}
                        className="sr-only"
                      />
                      <span
                        className={`flex items-center gap-1.5 font-label-caps text-label-caps uppercase tracking-wider ${
                          active ? "font-semibold text-primary" : "font-medium text-on-surface-variant"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            active ? "bg-primary" : "bg-outline-variant"
                          }`}
                        />
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Field>

            <Field label="Distribution Route / Territory" hint="Assigns driver delivery manifest sequence">
              <SelectShell>
                <select
                  className={SELECT_CLASS}
                  value={form.route}
                  onChange={(event) => update("route", event.target.value as CustomerRoute)}
                >
                  {ROUTE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </Field>

            <Field label="NTN / STRN Number" hint="Registration number used on customer documents.">
              <input
                className={`${INPUT_CLASS} font-mono-data uppercase`}
                value={form.ntn}
                onChange={(event) => update("ntn", event.target.value)}
                placeholder="e.g. 7349182-3"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          number="3"
          title="Credit Limit"
          description="Set an optional trade ceiling. Enter 0 for No Limit Set; credit limits never block sales."
          badge={
            <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              Optional
            </span>
          }
        >
          <Field
            label="Credit Limit (PKR)"
            hint="0 means No Limit Set and disables credit-limit alerts for this account."
          >
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-2.5 select-none font-mono-data-sm text-mono-data-sm font-medium text-on-surface-variant">
                Rs.
              </span>
              <input
                className={`${INPUT_CLASS} pl-10 pr-2.5 text-right font-mono-data`}
                value={form.creditLimit || ""}
                onChange={(event) =>
                  update("creditLimit", Math.max(0, Number(event.target.value) || 0))
                }
                placeholder="0.00"
                min="0"
                step="0.01"
                type="number"
              />
            </div>
          </Field>
        </SectionCard>

        <SectionCard
          number="4"
          title="Opening Ledger Position & Internal Notes"
          description="Carry-forward balance, security references, and specialized billing instructions."
          badge={
            <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              (Optional)
            </span>
          }
        >
          <Field
            label="Opening Balance (PKR)"
            hint="Amount already owed before StockFlow. Fixed at account creation and cannot be edited later."
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

          <Field label="Internal Remarks" hint="Strictly invisible to customer invoices and shipping slips">
            <textarea
              className={`${TEXTAREA_CLASS} resize-none`}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value.slice(0, 500))}
              placeholder="e.g. Blank security cheque received. Referred by Sheikh Hardware Corp."
              rows={2}
            />
          </Field>
        </SectionCard>
      </form>

      <aside
        aria-label="Form submission bar"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-between gap-4 border-t border-outline-variant/80 bg-surface-container-lowest/95 px-6 shadow-[0_-4px_16px_rgba(38,50,56,0.08)] backdrop-blur md:left-60"
      >
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden font-body-default text-body-default text-on-surface-variant sm:inline">
              New customer record will generate Master Ledger Account
            </span>
            <span className="rounded-md border border-outline-variant/70 bg-surface-container px-2.5 py-1 font-mono-data text-mono-data font-semibold text-primary">
              #{nextCode}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/customers")}
            className="flex h-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-customer-form"
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-6 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px active:bg-primary-hover/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "progress_activity" : "how_to_reg"}
            </span>
            {saving ? "Registering Ledger..." : "Save Customer"}
          </button>
        </div>
      </aside>
    </div>
  );
}
