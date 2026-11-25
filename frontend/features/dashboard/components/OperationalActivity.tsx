import Link from "next/link";
import type { ActivityItem, ActivityTone } from "../types";

const TONE_CLASS: Record<ActivityTone, string> = {
  primary: "text-primary-container",
  success: "text-primary",
  secondary: "text-on-surface-variant",
  error: "text-error",
};

const ICON: Record<ActivityItem["kind"], string> = {
  movement: "inventory_2",
  order: "receipt_long",
  product: "package",
  supplier: "local_shipping",
};

export function OperationalActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant pb-3">
        <div className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
          Operational Activity
        </div>
        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          Live records from products, stock, sales, and suppliers
        </span>
      </div>

      <div className="flex flex-col gap-3 font-body-default text-body-default">
        {items.length === 0 ? (
          <div className="py-8 text-center font-body-dense text-body-dense text-on-surface-variant">
            No activity recorded yet.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-2.5">
              <span
                className={`material-symbols-outlined mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface-container text-[15px] ${TONE_CLASS[item.tone]}`}
                aria-hidden="true"
              >
                {ICON[item.kind]}
              </span>
              <div className="flex flex-1 flex-wrap items-center justify-between gap-1 text-on-surface">
                <Link
                  href={item.href}
                  className="rounded-md px-1.5 py-0.5 transition duration-200 hover:bg-row-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="font-medium text-on-surface">{item.title}</span>
                  <span className="ml-1.5 text-on-surface-variant">{item.detail}</span>
                </Link>
                <span className="shrink-0 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                  {item.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
