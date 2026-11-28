"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  CITY_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  ROUTE_OPTIONS,
  STATUS_OPTIONS,
} from "../constants";
import { OpeningBalancePaymentSection } from "../../profiles/OpeningBalancePaymentSection";
import type { OpeningBalancePaymentInput } from "../../profiles/types";
import {
  recordCustomerOpeningBalancePayment,
  updateCustomer,
} from "../services/customer.service";
import type {
  City,
  Customer,
  CustomerRoute,
  CustomerStatus,
  CustomerType,
  UpdateCustomerInput,
} from "../types";
import { isValidCustomerPhone } from "../utils";

type EditCustomerDialogProps = {
  customer: Customer;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
};

const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";
const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer appearance-none pr-9`;
const TEXTAREA_CLASS =
  "w-full resize-none rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 py-2 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

function toInput(customer: Customer): UpdateCustomerInput {
  return {
    name: customer.name,
    businessName: customer.business,
    phone: customer.phone,
    altPhone: customer.altPhone,
    email: customer.email,
    city: customer.city,
    address: customer.address,
    customerType: customer.type,
    status: customer.status,
    route: customer.route,
    ntn: customer.ntn,
    notes: customer.notes,
  };
}

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

export function EditCustomerDialog({ customer, onClose, onSaved }: EditCustomerDialogProps) {
  const [form, setForm] = useState<UpdateCustomerInput>(() => toInput(customer));
  const [paymentTarget, setPaymentTarget] = useState(customer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof UpdateCustomerInput>(key: K, value: UpdateCustomerInput[K]) {
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

    setSaving(true);
    try {
      const updated = await updateCustomer(customer.id, {
        ...form,
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        address: form.address.trim(),
        ntn: form.ntn.trim(),
        notes: form.notes.trim(),
      });
      onSaved(updated);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update customer. Please try again."
      );
      setSaving(false);
    }
  }

  async function handleOpeningBalancePayment(input: OpeningBalancePaymentInput) {
    const updated = await recordCustomerOpeningBalancePayment(customer.id, input);
    setPaymentTarget(updated);
    onSaved(updated);
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-overlay/40 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-customer-title"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel"
      >
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant/80 bg-surface-container-low px-5 py-4">
          <div>
            <h2 id="edit-customer-title" className="font-headline-md text-headline-md text-on-surface">
              Edit Customer
            </h2>
            <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              #{customer.code} · credit settings and ledger totals are preserved
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit customer form"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition duration-200 hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Full Name">
              <input
                className={INPUT_CLASS}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              />
            </Field>
            <Field label="Business / Trade Title">
              <input
                className={INPUT_CLASS}
                value={form.businessName}
                onChange={(event) => update("businessName", event.target.value)}
              />
            </Field>
            <Field label="Primary Phone">
              <input
                className={`${INPUT_CLASS} font-mono-data`}
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
            </Field>
            <Field label="Alternate Phone">
              <input
                className={`${INPUT_CLASS} font-mono-data`}
                value={form.altPhone}
                onChange={(event) => update("altPhone", event.target.value)}
              />
            </Field>
            <Field label="Email Address">
              <input
                className={INPUT_CLASS}
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </Field>
            <Field label="Commercial Hub / City">
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
            <div className="sm:col-span-2">
              <Field label="Physical Dispatch & Billing Address">
                <textarea
                  className={TEXTAREA_CLASS}
                  value={form.address}
                  onChange={(event) => update("address", event.target.value.slice(0, 300))}
                  rows={2}
                />
              </Field>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Customer Classification">
              <SelectShell>
                <select
                  className={SELECT_CLASS}
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
            <Field label="Account Status">
              <SelectShell>
                <select
                  className={SELECT_CLASS}
                  value={form.status}
                  onChange={(event) => update("status", event.target.value as CustomerStatus)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </Field>
            <Field label="Distribution Route / Territory">
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
            <Field label="NTN / STRN Number">
              <input
                className={`${INPUT_CLASS} font-mono-data uppercase`}
                value={form.ntn}
                onChange={(event) => update("ntn", event.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Internal Remarks">
                <textarea
                  className={TEXTAREA_CLASS}
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value.slice(0, 500))}
                  rows={2}
                />
              </Field>
            </div>
          </section>

          <OpeningBalancePaymentSection
            openingBalance={paymentTarget.openingBalance}
            openingBalancePaid={paymentTarget.openingBalancePaid}
            remainingOpeningBalance={paymentTarget.remainingOpeningBalance}
            payments={paymentTarget.openingBalancePayments}
            onSubmit={handleOpeningBalancePayment}
          />

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
            className="h-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-lg bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
