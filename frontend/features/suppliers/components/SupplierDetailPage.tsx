"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchPurchases } from "../../purchases/services/purchase.service";
import type { PurchaseDto } from "../../purchases/types";
import { fetchSupplier } from "../services/supplier.service";
import { buildSupplierProfile } from "../supplierProfile";
import type { Supplier } from "../types";
import { formatRs } from "../utils";
import { SupplierMasterProfile } from "./SupplierMasterProfile";
import { SupplierPurchaseLedger } from "./SupplierPurchaseLedger";
import { SupplierDetailSummary } from "./SupplierDetailSummary";

type SupplierDetailPageProps = {
  supplierId: string;
};

type DetailTab = "purchase" | "payments" | "invoices" | "contact";

const TABS: Array<{ value: DetailTab; label: string }> = [
  { value: "purchase", label: "Purchase History" },
  { value: "payments", label: "Payments" },
  { value: "invoices", label: "Invoices" },
  { value: "contact", label: "Contact & Bank Profile" },
];

export function SupplierDetailPage({ supplierId }: SupplierDetailPageProps) {
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchases, setPurchases] = useState<PurchaseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState<DetailTab>("purchase");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [supplierData, purchaseData] = await Promise.all([
          fetchSupplier(supplierId),
          fetchPurchases(supplierId),
        ]);
        if (!cancelled) {
          setSupplier(supplierData);
          setPurchases(purchaseData);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load supplier profile. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supplierId, reloadKey]);

  const profile = useMemo(
    () => (supplier ? buildSupplierProfile(supplier, purchases) : null),
    [purchases, supplier]
  );

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-center">
        <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
          progress_activity
        </span>
        <div className="font-body-medium text-body-medium text-on-surface">
          Loading supplier profile…
        </div>
        <div className="font-mono-data-sm text-mono-data-sm text-secondary">
          Supplier ID: {supplierId}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
        <span className="material-symbols-outlined text-[32px] text-error">error_outline</span>
        <div className="font-body-medium text-body-medium text-on-surface">
          {error || "Supplier not found"}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="rounded bg-primary px-3.5 py-1.5 font-body-medium text-body-medium text-on-primary transition-colors hover:bg-primary-hover"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => router.push("/suppliers")}
            className="rounded border border-outline-variant px-3.5 py-1.5 font-body-medium text-body-medium text-secondary transition-colors hover:text-on-surface"
          >
            Back to Suppliers
          </button>
        </div>
      </div>
    );
  }

  const { header, financials } = profile;
  const tabs = TABS.map((tab) => {
    if (tab.value === "purchase" || tab.value === "invoices") {
      return { ...tab, count: financials.purchaseOrders };
    }
    if (tab.value === "payments") {
      return { ...tab, count: profile.payments.length };
    }
    return tab;
  });

  return (
    <div className="flex flex-col gap-3 pb-4" data-supplier-id={supplierId}>
      <nav className="flex flex-wrap items-center gap-1.5 font-label-caps text-label-caps uppercase tracking-wider text-secondary">
        <button type="button" onClick={() => router.push("/")} className="transition-colors hover:text-on-surface">
          Wholesale Operations
        </button>
        <span className="text-outline-variant">/</span>
        <button
          type="button"
          onClick={() => router.push("/suppliers")}
          className="transition-colors hover:text-on-surface"
        >
          Suppliers
        </button>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-primary">{header.name}</span>
      </nav>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
              {header.name}
            </h1>
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                header.status === "Active"
                  ? "border border-success-border bg-success-container text-success"
                  : "border border-warning-border bg-warning-container text-warning"
              }`}
            >
              {header.status}
            </span>
            <span className="rounded border border-outline-variant bg-surface-container-high px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              VENDOR #{header.vendorCode}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body-dense text-body-dense text-on-surface-variant">
            <span className="font-medium text-on-surface">{header.contact}</span>
            <span className="text-secondary">({header.contactRole})</span>
            <span className="text-outline-variant">·</span>
            <span className="font-mono-data-sm text-mono-data-sm text-on-surface">
              {header.phone}
            </span>
            <span className="text-outline-variant">·</span>
            {header.email && header.email.includes("@") ? (
              <a
                href={`mailto:${header.email}`}
                className="font-mono-data-sm text-mono-data-sm text-primary hover:underline"
              >
                {header.email}
              </a>
            ) : (
              <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                No email on file
              </span>
            )}
            <span className="text-outline-variant">·</span>
            <span>{header.location}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center">
          <button
            type="button"
            onClick={() => router.push(`/suppliers?edit=${supplierId}`)}
            className="px-2.5 py-1.5 font-body-medium text-body-medium text-secondary transition-colors hover:text-on-surface hover:underline"
          >
            Edit Supplier
          </button>
          <button
            type="button"
            onClick={() => router.push(`/purchases?supplierId=${supplierId}`)}
            className="flex h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-row-hover"
          >
            <span className="material-symbols-outlined text-[17px] text-secondary">receipt_long</span>
            Record Payment
          </button>
          <button
            type="button"
            onClick={() => router.push(`/purchases/create?supplierId=${supplierId}`)}
            className="flex h-[34px] items-center gap-1.5 rounded bg-primary px-4 font-body-medium text-body-medium text-on-primary transition-colors hover:bg-primary-hover"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            Create Purchase
          </button>
        </div>
      </div>

      <SupplierDetailSummary financials={financials} />

      <div className="grid grid-cols-1 items-start gap-5">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-1">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 transition-colors ${
                    activeTab === tab.value
                      ? "-mb-[1px] border-b-2 border-primary bg-surface-container-lowest font-body-medium text-body-medium text-primary"
                      : "font-body-default text-body-default text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span>{tab.label}</span>
                  {"count" in tab && tab.count !== undefined ? (
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono-data-sm text-[10px] leading-tight ${
                        activeTab === tab.value
                          ? "bg-primary text-on-primary"
                          : "border border-outline-variant bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "purchase" ? (
            <SupplierPurchaseLedger
              purchases={profile.purchases}
              totalCount={financials.purchaseOrders}
            />
          ) : null}

          {activeTab === "payments" ? (
            <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
              {profile.payments.length === 0 ? (
                <div className="px-4 py-10 text-center font-body-dense text-body-dense text-secondary">
                  No payments recorded for this supplier yet.
                </div>
              ) : (
                profile.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant px-4 py-3 last:border-b-0"
                  >
                    <div className="flex flex-col">
                      <span className="font-body-medium text-body-medium text-on-surface">
                        {payment.title}
                      </span>
                      <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                        {payment.detail}
                      </span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                      {payment.date}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {activeTab === "invoices" ? (
            <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
              {profile.invoices.length === 0 ? (
                <div className="px-4 py-10 text-center font-body-dense text-body-dense text-secondary">
                  No invoices recorded for this supplier yet.
                </div>
              ) : (
                profile.invoices.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant px-4 py-3 last:border-b-0"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono-data font-medium text-primary">{purchase.id}</span>
                      <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                        {purchase.date} · {purchase.reference}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded border border-outline-variant px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                        {purchase.status}
                      </span>
                      <span className="font-mono-data text-mono-data font-medium">
                        {formatRs(purchase.total)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {activeTab === "contact" ? (
            <SupplierMasterProfile
              vendorCode={header.vendorCode}
              rows={profile.masterProfile}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}
