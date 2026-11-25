"use client";

import type { SalesOrder } from "../../sales-orders/types";
import type { Customer } from "../types";
import { buildCustomerActivity, formatShortDate } from "../profile";
import { PROFILE_CARD, PROFILE_SUBHEADER } from "../../profiles/profile-ui";

type CustomerNotesProps = {
  customer: Customer;
  orders: SalesOrder[];
};

const TONE_CLASSES: Record<"primary" | "neutral" | "warning", string> = {
  primary: "text-primary",
  neutral: "text-on-surface",
  warning: "text-warning",
};

export function CustomerNotes({ customer, orders }: CustomerNotesProps) {
  const activity = buildCustomerActivity(orders);

  return (
    <div className="flex flex-col gap-3">
      <section className={PROFILE_CARD}>
        <div className={PROFILE_SUBHEADER}>
          <div className="font-headline-md text-headline-md text-on-surface">Internal Remarks</div>
        </div>
        {customer.notes ? (
          <p className="whitespace-pre-wrap px-4 py-3.5 font-body-default text-body-default text-on-surface-variant">
            {customer.notes}
          </p>
        ) : (
          <p className="px-4 py-3.5 font-body-dense text-body-dense text-secondary">
            No internal remarks saved for this account.
          </p>
        )}
      </section>

      <section className={PROFILE_CARD}>
        <div className={PROFILE_SUBHEADER}>
          <div className="font-headline-md text-headline-md text-on-surface">Account Activity</div>
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">{activity.length} events</span>
        </div>

        {activity.length === 0 ? (
          <div className="px-4 py-9 text-center font-body-dense text-body-dense text-secondary">
            Order and payment activity will appear here.
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
      </section>
    </div>
  );
}
