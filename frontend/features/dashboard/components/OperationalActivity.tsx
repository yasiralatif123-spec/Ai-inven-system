import Link from "next/link";
import type { ActivityItem, ActivityTone } from "../types";

const TONE_CLASS: Record<ActivityTone, string> = {
  primary: "text-primary-container",
  success: "text-[#2E7D58]",
  secondary: "text-secondary",
  error: "text-[#BA3C34]",
};

const ICON: Record<ActivityItem["kind"], string> = {
  movement: "inventory_2",
  order: "receipt_long",
  product: "package",
  supplier: "local_shipping",
};

export function OperationalActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="flex flex-col gap-3 rounded border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex items-center justify-between border-b border-outline-variant pb-2">
        <div className="font-body-medium font-semibold text-body-medium text-on-surface">
          Operational Activity
        </div>
        <span className="font-mono-data-sm text-mono-data-sm text-secondary">
          Live records from products, stock, sales, and suppliers
        </span>
      </div>

      <div className="flex flex-col gap-2.5 font-body-dense text-body-dense">
        {items.length === 0 ? (
          <div className="py-6 text-center font-body-dense text-body-dense text-secondary">
            No activity recorded yet.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-2.5">
              <span
                className={`material-symbols-outlined mt-0.5 text-[15px] ${TONE_CLASS[item.tone]}`}
                aria-hidden="true"
              >
                {ICON[item.kind]}
              </span>
              <div className="flex flex-1 flex-wrap items-center justify-between gap-1 text-on-surface">
                <Link href={item.href} className="hover:underline">
                  <span className="font-medium text-on-surface">{item.title}</span>
                  <span className="ml-1.5 text-secondary">{item.detail}</span>
                </Link>
                <span className="shrink-0 font-mono-data-sm text-mono-data-sm text-secondary">
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
