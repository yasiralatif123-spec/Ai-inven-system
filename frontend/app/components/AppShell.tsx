import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  icon: string;
  href: string;
  path: string;
  badge?: string;
  danger?: boolean;
};

const mainMenu: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/", path: "dashboard" },
  { label: "Products", icon: "inventory_2", href: "/products", path: "products" },
  { label: "Inventory", icon: "warehouse", href: "/inventory", path: "inventory" },
  { label: "Purchases", icon: "shopping_cart", href: "/purchases", path: "purchases" },
  { label: "Sales & Orders", icon: "receipt_long", href: "/sales-orders", path: "sales-orders" },
  { label: "Customers", icon: "groups", href: "/customers", path: "customers" },
  { label: "Suppliers", icon: "local_shipping", href: "/suppliers", path: "suppliers" },
  { label: "Payments & Finance", icon: "payments", href: "#", path: "payments-and-finance" },
];

const intelligenceMenu: NavItem[] = [
  { label: "AI Assistant", icon: "auto_awesome", href: "#", path: "ai-assistant" },
  { label: "Notifications", icon: "notifications", href: "#", path: "notifications", badge: "3" },
];

const systemMenu: NavItem[] = [
  { label: "Staff & Roles", icon: "badge", href: "#", path: "staff-and-roles" },
  { label: "Settings", icon: "settings", href: "#", path: "settings" },
  { label: "Help & Support", icon: "help", href: "#", path: "help-and-support" },
  { label: "Logout", icon: "logout", href: "#", path: "login", danger: true },
];

function NavGroup({ title, items, activePath }: { title: string; items: NavItem[]; activePath: string }) {
  return (
    <div className="flex flex-col gap-y-1">
      <div className="px-2 py-1 font-label-caps text-label-caps uppercase tracking-wider text-secondary">{title}</div>
      {items.map((item) => {
        const active = item.path === activePath;
        if (item.danger) {
          return (
            <Link
              key={item.path}
              href={item.href}
              className="flex items-center rounded px-3 py-1.5 font-body-default text-body-default text-error transition-colors hover:bg-error-container hover:text-on-error-container"
            >
              <span className="material-symbols-outlined mr-2.5 text-[18px] text-error">{item.icon}</span>
              {item.label}
            </Link>
          );
        }
        if (active) {
          return (
            <Link
              key={item.path}
              href={item.href}
              aria-current="page"
              className="flex items-center justify-between rounded border-l-2 border-primary-container bg-surface-container-highest px-3 py-1.5 pl-[10px] font-body-medium text-body-medium text-primary transition-colors"
            >
              <div className="flex items-center">
                <span className="material-symbols-outlined mr-2.5 text-[18px] text-primary">{item.icon}</span>
                {item.label}
              </div>
              {item.badge ? (
                <span className="rounded border border-outline-variant bg-surface-variant px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        }
        return (
          <Link
            key={item.path}
            href={item.href}
            className="flex items-center justify-between rounded px-3 py-1.5 font-body-default text-body-default text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <div className="flex items-center">
              <span className="material-symbols-outlined mr-2.5 text-[18px] text-secondary">{item.icon}</span>
              {item.label}
            </div>
            {item.badge ? (
              <span className="rounded border border-outline-variant bg-surface-variant px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

export function AppShell({ activePath, children }: { activePath: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-container-low">
      <aside className="fixed left-0 top-0 z-50 flex h-full w-60 flex-col justify-between overflow-y-auto border-r border-outline-variant bg-surface-container-high">
        <div className="flex flex-col">
          <div className="border-b border-outline-variant bg-surface-container-high px-5 py-4">
            <div className="font-headline-md text-headline-md tracking-tight text-on-surface">StockFlow</div>
            <div className="mt-0.5 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              Admin Panel
            </div>
          </div>
          <nav className="flex flex-col gap-y-4 px-3 py-3">
            <NavGroup title="Main Menu" items={mainMenu} activePath={activePath} />
            <NavGroup title="Intelligence" items={intelligenceMenu} activePath={activePath} />
            <NavGroup title="System" items={systemMenu} activePath={activePath} />
          </nav>
        </div>
      </aside>

      <div className="pl-60">
        <header className="fixed left-60 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6">
          <div className="flex items-center gap-3">
            <div className="font-body-medium text-body-medium text-on-surface">Wholesale Operations</div>
            <span className="text-outline-variant">/</span>
            <div className="flex items-center rounded border border-outline-variant bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              Today · 16 Nov 2026
            </div>
          </div>
          <div className="mx-6 flex max-w-md flex-1 items-center gap-4">
            <div className="relative flex w-full items-center">
              <span className="material-symbols-outlined pointer-events-none absolute left-2.5 text-[18px] text-outline">
                search
              </span>
              <input
                className="h-8 w-full rounded border border-outline-variant bg-surface pl-8 pr-12 font-body-default text-body-default text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
                placeholder="Search products, customers, invoices..."
                type="text"
              />
              <span className="pointer-events-none absolute right-2 rounded border border-outline-variant bg-surface-container-high px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-outline">
                ⌘K
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
              <span className="material-symbols-outlined text-[18px]">notifications</span>
            </button>
            <div className="mx-1 h-4 w-px bg-outline-variant"></div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <span className="material-symbols-outlined text-[18px] text-on-primary">person</span>
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-body-medium text-body-medium leading-tight text-on-surface">Tariq M.</span>
                  <span className="rounded border border-outline-variant bg-secondary-container px-1.5 py-0.5 font-label-caps text-label-caps uppercase text-on-secondary-container">
                    Owner
                  </span>
                </div>
                <span className="font-mono-data-sm text-mono-data-sm leading-tight text-secondary">ID #001</span>
              </div>
            </div>
          </div>
        </header>

        <main className="relative min-h-screen w-full bg-surface-container-low px-6 py-6 pt-14">{children}</main>
      </div>
    </div>
  );
}
