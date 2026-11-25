"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import logo from "../../logo/stockflow-logo-transparent.webp";
import { useAuth } from "../../features/auth/hooks/useAuth";

const sidebarIcons: Record<string, ReactNode> = {
  "layout-dashboard": (
    <>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </>
  ),
  package: (
    <>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <path d="m7.5 4.27 9 5.15" />
    </>
  ),
  tags: (
    <>
      <path d="M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z" />
      <path d="M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193" />
      <circle cx="10.5" cy="6.5" r=".5" fill="currentColor" />
    </>
  ),
  warehouse: (
    <>
      <path d="M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11" />
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z" />
      <path d="M6 13h12" />
      <path d="M6 17h12" />
    </>
  ),
  "shopping-cart": (
    <>
      <path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18" />
      <path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25" />
      <circle cx="18" cy="20" r="2" />
      <circle cx="8" cy="20" r="2" />
    </>
  ),
  "receipt-text": (
    <>
      <path d="M13 16H8" />
      <path d="M14 8H8" />
      <path d="M16 12H8" />
      <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />
    </>
  ),
  "users-round": (
    <>
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
    </>
  ),
  truck: (
    <>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </>
  ),
  wallet: (
    <>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </>
  ),
  bell: (
    <>
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </>
  ),
  "shield-check": (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  "settings-2": (
    <>
      <path d="M14 17H5" />
      <path d="M19 7h-9" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </>
  ),
  "circle-help": (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 9.5a3 2.5 0 016 0c0 2-2 2-3 3.5" />
      <path d="M12 17h.01" />
    </>
  ),
  "log-out": (
    <>
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </>
  ),
};

function SidebarIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {sidebarIcons[name] ?? null}
    </svg>
  );
}

type NavItem = {
  label: string;
  icon: string;
  href: string;
  path: string;
  badge?: string;
  danger?: boolean;
};

const mainMenu: NavItem[] = [
  { label: "Dashboard", icon: "layout-dashboard", href: "/", path: "dashboard" },
  { label: "Products", icon: "package", href: "/products", path: "products" },
  { label: "Brands", icon: "tags", href: "/brands", path: "brands" },
  { label: "Inventory", icon: "warehouse", href: "/inventory", path: "inventory" },
  { label: "Purchases", icon: "shopping-cart", href: "/purchases", path: "purchases" },
  { label: "Sales & Orders", icon: "receipt-text", href: "/sales-orders", path: "sales-orders" },
  { label: "Customers", icon: "users-round", href: "/customers", path: "customers" },
  { label: "Suppliers", icon: "truck", href: "/suppliers", path: "suppliers" },
  { label: "Payments & Finance", icon: "wallet", href: "#", path: "payments-and-finance" },
];

const intelligenceMenu: NavItem[] = [
  { label: "AI Assistant", icon: "sparkles", href: "#", path: "ai-assistant" },
  { label: "Notifications", icon: "bell", href: "#", path: "notifications", badge: "3" },
];

const systemMenu: NavItem[] = [
  { label: "Staff & Roles", icon: "shield-check", href: "#", path: "staff-and-roles" },
  { label: "Settings", icon: "settings-2", href: "#", path: "settings" },
  { label: "Help & Support", icon: "circle-help", href: "#", path: "help-and-support" },
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
      <div className="px-3 pb-1.5 pt-1 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-surface-variant">{title}</div>
      {items.map((item) => {
        const active = item.path === activePath;
        const badgeClass = active
          ? "flex h-5 min-w-5 items-center justify-center rounded-md border border-primary/20 bg-primary-container px-1 font-mono-data-sm text-mono-data-sm text-primary"
          : "flex h-5 min-w-5 items-center justify-center rounded-md border border-outline-variant bg-surface-variant px-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant";
        if (item.danger) {
          return (
            <button
              key={item.path}
              type="button"
              onClick={onLogout}
              className="group flex h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-left font-body-default text-body-default text-error transition duration-200 hover:bg-error-container hover:text-on-error-container active:translate-y-px active:bg-error-container/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SidebarIcon name={item.icon} className="h-5 w-5 shrink-0 text-error" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        }
        if (active) {
          return (
            <Link
              key={item.path}
              href={item.href}
              aria-current="page"
              className="group flex h-11 items-center justify-between rounded-lg border-l-2 border-primary bg-primary-container pl-2.5 pr-2.5 font-body-medium text-body-medium text-primary transition duration-200 hover:bg-primary-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <SidebarIcon name={item.icon} className="h-5 w-5 shrink-0 text-primary" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge ? <span className={badgeClass}>{item.badge}</span> : null}
            </Link>
          );
        }
        return (
          <Link
            key={item.path}
            href={item.href}
            className="group flex h-11 items-center justify-between rounded-lg px-2.5 font-body-default text-body-default text-on-surface-variant transition duration-200 hover:bg-nav-hover hover:text-on-surface active:translate-y-px active:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <SidebarIcon name={item.icon} className="h-5 w-5 shrink-0 text-secondary transition-colors group-hover:text-primary" />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge ? <span className={badgeClass}>{item.badge}</span> : null}
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
    <div className="min-h-dvh bg-page">
      <aside className="fixed left-0 top-0 z-50 flex h-dvh w-60 flex-col justify-between overflow-y-auto overscroll-contain border-r border-border bg-sidebar [scrollbar-color:var(--color-outline-variant)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-outline-variant [&::-webkit-scrollbar-thumb:hover]:bg-outline">
        <div className="flex flex-col">
          <div className="border-b border-border px-4 py-5">
            <div className="flex px-1">
              <Image
                src={logo}
                alt="StockFlow"
                priority
                className="h-auto w-[176px] object-contain"
              />
            </div>
          </div>
          <nav className="flex flex-col gap-y-6 px-3 pb-6 pt-5">
            <NavGroup title="Main Menu" items={mainMenu} activePath={activePath} />
            <NavGroup title="Intelligence" items={intelligenceMenu} activePath={activePath} />
            <NavGroup title="System" items={systemMenu} activePath={activePath} />
            <div className="flex flex-col gap-y-1 pt-1">
              <button
                type="button"
                onClick={() => void logout()}
                className="group flex h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-left font-body-default text-body-default text-error transition duration-200 hover:bg-error-container hover:text-on-error-container active:translate-y-px active:bg-error-container/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <SidebarIcon name="log-out" className="h-5 w-5 shrink-0 text-error" />
                <span className="truncate">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div className="pl-60">
        <header className="fixed left-60 right-0 top-0 z-40 flex h-[68px] items-center justify-between gap-4 border-b border-border bg-navbar px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="truncate font-body-medium text-body-medium tracking-[-0.01em] text-on-surface">Wholesale Operations</div>
            <span className="text-outline-variant/80">/</span>
            <div className="flex shrink-0 items-center rounded-md border border-border bg-surface-container-low px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              Today · 16 Nov 2026
            </div>
          </div>
          <div className="mx-2 flex min-w-0 max-w-[420px] flex-1 items-center lg:mx-8">
            <div className="relative flex w-full items-center">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-secondary">
                search
              </span>
              <input
                className="h-10 w-full rounded-lg border border-input-border bg-input pl-9 pr-14 font-body-default text-body-default text-on-surface transition duration-200 placeholder:text-secondary/90 hover:border-primary/50 hover:bg-page/40 focus:border-primary focus:bg-input focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Search products, customers, invoices..."
                type="text"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-surface-container px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                ⌘K
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-input text-on-surface-variant transition duration-200 hover:border-primary/30 hover:bg-nav-hover hover:text-primary active:translate-y-px active:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              <span className="material-symbols-outlined text-[18px]">notifications</span>
            </button>
            <div className="h-6 w-px bg-border"></div>
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
                <span className="material-symbols-outlined text-[18px] text-on-primary">person</span>
              </div>
              <div className="flex min-w-0 flex-col leading-tight text-left">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-body-medium text-body-medium text-on-surface">{displayName}</span>
                  <span className="shrink-0 rounded border border-primary/15 bg-primary-container px-1.5 py-px font-label-caps text-label-caps uppercase tracking-wide text-on-primary-container">
                    {displayRole}
                  </span>
                </div>
                {displayId ? <span className="truncate font-mono-data-sm text-mono-data-sm text-secondary">{displayId}</span> : null}
              </div>
            </div>
          </div>
        </header>

        <main className="relative min-h-dvh mx-auto w-full max-w-[1440px] bg-page px-6 pb-10 pt-20 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
