"use client";

import type { SalesOrder } from "../../sales-orders/types";
import type { Customer } from "../types";
import { buildCustomerActivity, formatShortDate } from "../profile";

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
      <section className="rounded border border-outline-variant bg-surface-container-lowest p-4">
        <div className="font-headline-md text-headline-md text-on-surface">Internal Remarks</div>
        {customer.notes ? (
          <p className="mt-2 whitespace-pre-wrap font-body-default text-body-default text-on-surface-variant">
            {customer.notes}
          </p>
        ) : (
          <p className="mt-2 font-body-dense text-body-dense text-secondary">
            No internal remarks saved for this account.
          </p>
        )}
      </section>

      <section className="rounded border border-outline-variant bg-surface-container-lowest p-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-2">
          <div className="font-headline-md text-headline-md text-on-surface">Account Activity</div>
          <span className="font-mono-data-sm text-mono-data-sm text-secondary">{activity.length} events</span>
        </div>

        {activity.length === 0 ? (
          <div className="py-8 text-center font-body-dense text-body-dense text-secondary">
            Order and payment activity will appear here.
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
      </section>
    </div>
  );
}
