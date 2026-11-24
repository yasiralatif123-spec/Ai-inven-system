import Link from "next/link";
import type { DashboardSources } from "../types";

const LINK_CLASS =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container active:translate-y-px active:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container";

export function DashboardQuickActions({ sources }: { sources: DashboardSources }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-3 shadow-panel">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/sales-orders?new=1" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-container px-3.5 font-body-medium text-body-medium text-on-primary transition duration-200 hover:bg-primary active:translate-y-px active:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container">
          <span className="material-symbols-outlined text-[17px] leading-none">add</span>
          <span>Create Sale</span>
        </Link>
        <a href="/products/add" className={LINK_CLASS}>
          <span className="material-symbols-outlined text-[17px] text-on-surface-variant">inventory_2</span>
          <span>Add Product</span>
        </a>
        <Link href="/suppliers" className={LINK_CLASS}>
          <span className="material-symbols-outlined text-[17px] text-on-surface-variant">shopping_cart</span>
          <span>Create Purchase</span>
        </Link>
        <Link href="/customers/add" className={LINK_CLASS}>
          <span className="material-symbols-outlined text-[17px] text-on-surface-variant">person_add</span>
          <span>Add Customer</span>
        </Link>
        <Link href="/sales-orders" className={LINK_CLASS}>
          <span className="material-symbols-outlined text-[17px] text-on-surface-variant">payments</span>
          <span>Record Payment</span>
        </Link>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-container"></span>
        <span>
          Fiscal Day: {sources.dateLabel} · {sources.orders} orders synced at {sources.generatedAt}
        </span>
      </div>
    </section>
  );
}
