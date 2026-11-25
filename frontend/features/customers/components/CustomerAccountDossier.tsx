"use client";

import type { SalesOrder } from "../../sales-orders/types";
import type { Customer } from "../types";
import {
  buildCustomerActivity,
  formatShortDate,
  paymentTermsLabel,
  type CustomerActivity,
} from "../profile";
import {
  PROFILE_CARD,
  PROFILE_NUMERIC,
  PROFILE_SUBHEADER,
  ProfileBadge,
} from "../../profiles/profile-ui";

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
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="font-label-caps text-label-caps uppercase tracking-wide text-secondary">
        {label}
      </span>
      <span
        className={`min-w-0 break-words font-body-medium text-body-medium text-on-surface ${
          mono ? `${PROFILE_NUMERIC} font-medium` : ""
        }`}
      >
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
      <section className={PROFILE_CARD}>
        <div className={PROFILE_SUBHEADER}>
          <div className="font-headline-md text-headline-md text-on-surface">
            Account Master Profile
          </div>
          <ProfileBadge tone="primary">{priceMatrix}</ProfileBadge>
        </div>

        <div className="flex flex-col gap-3 px-4 py-3.5 font-body-default text-body-default">
          <DetailRow label="Trade Title" value={customer.business} />
          <DetailRow label="Contact Person" value={`${customer.name} (Proprietor)`} />

          <div className="grid grid-cols-2 gap-3 border-t border-outline-variant pt-3">
            <DetailRow label="Primary Phone" value={customer.phone} mono />
            <DetailRow label="Alternate Phone" value={customer.altPhone} mono />
          </div>

          <div className="border-t border-outline-variant pt-3">
            <DetailRow label="Email Dispatch" value={customer.email} mono />
          </div>

          <div className="border-t border-outline-variant pt-3">
            <DetailRow label="Warehouse / Shop Address" value={customer.address} />
            <div className="mt-1 font-mono-data-sm text-mono-data-sm text-secondary">
              Route: {customer.routeLabel}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-outline-variant pt-3">
            <DetailRow label="Payment Terms" value={paymentTermsLabel(customer.paymentTerms)} />
            <DetailRow label="Customer Type" value={customer.type} />
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-outline-variant pt-3">
            <DetailRow label="FBR NTN / STRN" value={customer.ntn} mono />
            <ProfileBadge tone={customer.ntn ? "success" : "neutral"}>
              {customer.ntn ? "Active Filer" : "Not on file"}
            </ProfileBadge>
          </div>
        </div>
      </section>

      <section className={PROFILE_CARD}>
        <div className={PROFILE_SUBHEADER}>
          <div className="font-headline-md text-headline-md text-on-surface">
            Chronological Ledger Log
          </div>
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">
            {formatShortDate(customer.updatedAt || customer.createdAt)}
          </span>
        </div>

        {activity.length === 0 ? (
          <div className="px-4 py-9 text-center">
            <div className="font-body-medium text-body-medium text-on-surface">
              No ledger activity yet
            </div>
            <div className="mt-1 font-body-dense text-body-dense text-secondary">
              Saved orders and payments for this customer will appear here.
            </div>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border px-4">
            {activity.map((item) => (
              <div key={item.id} className="flex flex-col gap-0.5 py-2.5">
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
          <div className="border-t border-outline-variant px-4 py-3">
            <span className="font-label-caps text-label-caps uppercase tracking-wide text-secondary">
              Internal Remarks
            </span>
            <p className="mt-1 font-body-dense text-body-dense text-on-surface-variant">
              {customer.notes}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
