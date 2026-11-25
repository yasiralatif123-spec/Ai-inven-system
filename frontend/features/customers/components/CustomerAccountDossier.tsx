"use client";

import type { SalesOrder } from "../../sales-orders/types";
import type { Customer } from "../types";
import {
  buildCustomerActivity,
  formatShortDate,
  paymentTermsLabel,
  type CustomerActivity,
} from "../profile";

type CustomerAccountDossierProps = {
  customer: Customer;
  orders: SalesOrder[];
};

const TONE_CLASSES: Record<CustomerActivity["tone"], string> = {
  primary: "text-primary",
  neutral: "text-on-surface",
  warning: "text-warning",
};

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-label-caps text-label-caps uppercase text-secondary">{label}</span>
      <span className={`${mono ? "font-mono-data text-mono-data" : "font-body-medium text-body-medium"} text-on-surface`}>
        {value || "—"}
      </span>
    </div>
  );
}

export function CustomerAccountDossier({ customer, orders }: CustomerAccountDossierProps) {
  const activity = buildCustomerActivity(orders).slice(0, 6);
  const priceMatrix =
    customer.type === "Wholesale"
      ? "Tier-A Wholesale"
      : customer.type === "Distributor"
        ? "Primary Channel Partner"
        : customer.type === "Retailer"
          ? "Tier-B Retail"
          : "Institutional";

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded border border-outline-variant bg-surface-container-lowest p-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-2">
          <div className="font-headline-md text-headline-md text-on-surface">
            Account Master Profile
          </div>
          <span className="rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
            {priceMatrix}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2.5 font-body-default text-body-default">
          <DetailRow label="Trade Title" value={customer.business} />
          <DetailRow label="Contact Person" value={`${customer.name} (Proprietor)`} />

          <div className="grid grid-cols-2 gap-2 border-t border-outline-variant pt-2">
            <DetailRow label="Primary Phone" value={customer.phone} mono />
            <DetailRow label="Alternate Phone" value={customer.altPhone} mono />
          </div>

          <div className="border-t border-outline-variant pt-2">
            <DetailRow label="Email Dispatch" value={customer.email} mono />
          </div>

          <div className="border-t border-outline-variant pt-2">
            <DetailRow label="Warehouse / Shop Address" value={customer.address} />
            <div className="mt-1 font-mono-data-sm text-mono-data-sm text-secondary">
              Route: {customer.routeLabel}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-outline-variant pt-2">
            <DetailRow label="Payment Terms" value={paymentTermsLabel(customer.paymentTerms)} />
            <DetailRow label="Customer Type" value={customer.type} />
          </div>

          <div className="flex items-center justify-between border-t border-outline-variant pt-2">
            <DetailRow label="FBR NTN / STRN" value={customer.ntn} mono />
            {customer.ntn ? (
              <span className="rounded border border-success-border bg-success-container px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                Active Filer
              </span>
            ) : (
              <span className="rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                Not on file
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="rounded border border-outline-variant bg-surface-container-lowest p-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-2">
          <div className="font-headline-md text-headline-md text-on-surface">
            Chronological Ledger Log
          </div>
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">
            {formatShortDate(customer.updatedAt || customer.createdAt)}
          </span>
        </div>

        {activity.length === 0 ? (
          <div className="py-6 text-center">
            <div className="font-body-medium text-body-medium text-on-surface">
              No ledger activity yet
            </div>
            <div className="mt-1 font-body-dense text-body-dense text-secondary">
              Saved orders and payments for this customer will appear here.
            </div>
          </div>
        ) : (
          <div className="mt-1 flex flex-col divide-y divide-border">
            {activity.map((item) => (
              <div key={item.id} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-body-medium text-body-medium ${TONE_CLASSES[item.tone]}`}>
                    {item.title}
                  </span>
                  <span className="shrink-0 font-mono-data-sm text-mono-data-sm text-secondary">
                    {formatShortDate(item.date)}
                  </span>
                </div>
                <p className="font-mono-data-sm text-mono-data-sm text-secondary">{item.detail}</p>
              </div>
            ))}
          </div>
        )}

        {customer.notes ? (
          <div className="mt-2 border-t border-outline-variant pt-2">
            <span className="font-label-caps text-label-caps uppercase text-secondary">
              Internal Remarks
            </span>
            <p className="mt-0.5 font-body-dense text-body-dense text-on-surface-variant">
              {customer.notes}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
