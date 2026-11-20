import Link from "next/link";
import type { DashboardSources } from "../types";

const LINK_CLASS =
  "inline-flex h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:border-outline hover:bg-surface-container";

export function DashboardQuickActions({ sources }: { sources: DashboardSources }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded border border-outline-variant bg-surface-container-lowest p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/sales-orders?new=1" className="inline-flex h-[34px] items-center gap-1.5 rounded bg-primary-container px-3 font-body-medium text-body-medium text-on-primary transition-colors hover:bg-primary">
          <span className="material-symbols-outlined text-[17px] leading-none">add</span>
          <span>Create Sale</span>
        </Link>
        <a href="/products/add" className={LINK_CLASS}>
          <span className="material-symbols-outlined text-[16px] text-secondary">inventory_2</span>
          <span>Add Product</span>
        </a>
        <Link href="/suppliers" className={LINK_CLASS}>
          <span className="material-symbols-outlined text-[16px] text-secondary">shopping_cart</span>
          <span>Create Purchase</span>
        </Link>
        <Link href="/customers/add" className={LINK_CLASS}>
          <span className="material-symbols-outlined text-[16px] text-secondary">person_add</span>
          <span>Add Customer</span>
        </Link>
        <Link href="/sales-orders" className={LINK_CLASS}>
          <span className="material-symbols-outlined text-[16px] text-secondary">payments</span>
          <span>Record Payment</span>
        </Link>
      </div>
      <div className="flex items-center gap-2 rounded border border-outline-variant bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-container"></span>
        <span>
          Fiscal Day: {sources.dateLabel} · {sources.orders} orders synced at {sources.generatedAt}
        </span>
      </div>
    </section>
  );
}
