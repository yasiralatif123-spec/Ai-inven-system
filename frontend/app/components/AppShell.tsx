"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";

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
];

function NavGroup({
  title,
  items,
  activePath,
  onLogout,
}: {
  title: string;
  items: NavItem[];
  activePath: string;
  onLogout?: () => void;
}) {
  return (
    <div className="flex flex-col gap-y-1">
      <div className="px-2 py-1 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">{title}</div>
      {items.map((item) => {
        const active = item.path === activePath;
        if (item.danger) {
          return (
            <button
              key={item.path}
              type="button"
              onClick={onLogout}
              className="flex items-center rounded px-3 py-2 text-left font-body-default text-body-default text-error transition duration-200 hover:bg-error-container hover:text-on-error-container active:translate-y-px active:bg-error-container/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            >
              <span className="material-symbols-outlined mr-2.5 text-[18px] text-error">{item.icon}</span>
              {item.label}
            </button>
          );
        }
        if (active) {
          return (
            <Link
              key={item.path}
              href={item.href}
              aria-current="page"
              className="flex items-center justify-between rounded border-l-2 border-primary bg-primary-container/15 px-3 py-2 pl-[10px] font-body-medium text-body-medium text-primary transition duration-200 hover:bg-primary-container/25 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
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
            className="flex items-center justify-between rounded px-3 py-2 font-body-default text-body-default text-on-surface-variant transition duration-200 hover:bg-surface-container hover:text-on-surface active:translate-y-px active:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
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

function roleLabel(role: string | null | undefined) {
  if (!role) return "User";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function AppShell({ activePath, children }: { activePath: string; children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const displayName = user?.name || (loading ? "Loading..." : "Signed out");
  const displayRole = roleLabel(user?.role);
  const displayId = user?.id ? `ID #${user.id.slice(-4).toUpperCase()}` : "";

  return (
    <div className="min-h-dvh bg-surface-container-low">
      <aside className="fixed left-0 top-0 z-50 flex h-dvh w-60 flex-col justify-between overflow-y-auto border-r border-outline-variant bg-surface-container shadow-panel">
        <div className="flex flex-col">
          <div className="border-b border-outline-variant bg-surface-container px-5 py-5">
            <div className="font-headline-lg text-headline-lg tracking-tight text-on-surface">StockFlow</div>
            <div className="mt-0.5 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              Admin Panel
            </div>
          </div>
          <nav className="flex flex-col gap-y-5 px-3 py-4">
            <NavGroup title="Main Menu" items={mainMenu} activePath={activePath} />
            <NavGroup title="Intelligence" items={intelligenceMenu} activePath={activePath} />
            <NavGroup title="System" items={systemMenu} activePath={activePath} />
            <div className="flex flex-col gap-y-1">
              <button
                type="button"
                onClick={() => void logout()}
                className="flex items-center rounded px-3 py-2 text-left font-body-default text-body-default text-error transition duration-200 hover:bg-error-container hover:text-on-error-container active:translate-y-px active:bg-error-container/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
              >
                <span className="material-symbols-outlined mr-2.5 text-[18px] text-error">logout</span>
                Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div className="pl-60">
        <header className="fixed left-60 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-8 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="font-body-medium text-body-medium text-on-surface">Wholesale Operations</div>
            <span className="text-outline-variant">/</span>
            <div className="flex items-center rounded border border-outline-variant bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              Today · 16 Nov 2026
            </div>
          </div>
          <div className="mx-8 flex max-w-md flex-1 items-center gap-4">
            <div className="relative flex w-full items-center">
              <span className="material-symbols-outlined pointer-events-none absolute left-2.5 text-[18px] text-outline">
                search
              </span>
              <input
                className="h-9 w-full rounded-lg border border-outline-variant bg-surface pl-8 pr-12 font-body-default text-body-default text-on-surface transition duration-200 placeholder:text-outline hover:border-outline active:bg-surface-container-low focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
                placeholder="Search products, customers, invoices..."
                type="text"
              />
              <span className="pointer-events-none absolute right-2 rounded border border-outline-variant bg-surface-container-high px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-outline">
                ⌘K
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition duration-200 hover:bg-surface-container hover:text-on-surface active:translate-y-px active:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container">
              <span className="material-symbols-outlined text-[18px]">notifications</span>
            </button>
            <div className="mx-1 h-4 w-px bg-outline-variant"></div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                <span className="material-symbols-outlined text-[18px] text-on-primary">person</span>
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-body-medium text-body-medium leading-tight text-on-surface">{displayName}</span>
                  <span className="rounded border border-outline-variant bg-secondary-container px-1.5 py-0.5 font-label-caps text-label-caps uppercase text-on-secondary-container">
                    {displayRole}
                  </span>
                </div>
                {displayId ? <span className="font-mono-data-sm text-mono-data-sm leading-tight text-secondary">{displayId}</span> : null}
              </div>
            </div>
          </div>
        </header>

        <main className="relative min-h-dvh mx-auto w-full max-w-[1440px] bg-surface-container-low px-6 pb-10 pt-20 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
