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
import {
  PROFILE_BUTTON_PRIMARY,
  PROFILE_BUTTON_QUIET,
  PROFILE_BUTTON_SECONDARY,
  PROFILE_CARD,
  PROFILE_ID_TOKEN,
  PROFILE_NUMERIC,
  PROFILE_TABLE_ROW,
  ProfileBadge,
  ProfileEmptyState,
  ProfileErrorState,
  ProfileLoadingState,
  ProfileMetaItem,
  ProfileTabs,
} from "../../profiles/profile-ui";

type SupplierDetailPageProps = {
  supplierId: string;
};

type DetailTab = "purchase" | "payments" | "invoices" | "contact";

const TABS: Array<{ value: DetailTab; label: string; icon: string }> = [
  { value: "purchase", label: "Purchase History", icon: "shopping_cart" },
  { value: "payments", label: "Payments", icon: "payments" },
  { value: "invoices", label: "Invoices", icon: "receipt_long" },
  { value: "contact", label: "Contact & Bank Profile", icon: "badge" },
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
      <ProfileLoadingState
        label="Loading supplier profile…"
        detail={`Supplier ID: ${supplierId}`}
      />
    );
  }

  if (error || !profile) {
    return (
      <ProfileErrorState
        message={error || "Supplier not found"}
        onRetry={() => setReloadKey((key) => key + 1)}
        onBack={() => router.push("/suppliers")}
        backLabel="Back to Suppliers"
      />
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
      <nav className="flex flex-wrap items-center gap-1.5 font-body-dense text-body-dense text-secondary">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined text-[15px] text-primary">home</span>
          Wholesale Operations
        </button>
        <span className="material-symbols-outlined text-[13px] text-outline-variant">chevron_right</span>
        <button
          type="button"
          onClick={() => router.push("/suppliers")}
          className="transition-colors hover:text-primary"
        >
          Suppliers
        </button>
        <span className="material-symbols-outlined text-[13px] text-outline-variant">chevron_right</span>
        <span className="font-body-medium font-semibold text-on-surface">{header.name}</span>
        <span className={PROFILE_ID_TOKEN}>VENDOR #{header.vendorCode}</span>
      </nav>

      <section className={`${PROFILE_CARD} p-4`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container font-headline-md text-headline-md font-semibold text-primary">
              {(header.name || "?").slice(0, 1).toUpperCase()}
            </span>

            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
                  {header.name}
                </h1>
                <ProfileBadge tone={header.status === "Active" ? "success" : "warning"}>
                  {header.status}
                </ProfileBadge>
                <ProfileBadge tone="primary">VENDOR #{header.vendorCode}</ProfileBadge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <ProfileMetaItem>
                  <span className="font-body-medium text-on-surface">{header.contact}</span>
                  <span className="text-secondary"> ({header.contactRole})</span>
                </ProfileMetaItem>
                <ProfileMetaItem icon="call" mono>
                  {header.phone}
                </ProfileMetaItem>
                {header.email && header.email.includes("@") ? (
                  <ProfileMetaItem icon="mail" mono>
                    <a
                      href={`mailto:${header.email}`}
                      className="text-primary hover:underline"
                    >
                      {header.email}
                    </a>
                  </ProfileMetaItem>
                ) : (
                  <ProfileMetaItem icon="mail" mono>
                    No email on file
                  </ProfileMetaItem>
                )}
                <ProfileMetaItem icon="location_on">{header.location}</ProfileMetaItem>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/suppliers?edit=${supplierId}`)}
              className={PROFILE_BUTTON_QUIET}
            >
              Edit Supplier
            </button>
            <button
              type="button"
              onClick={() => router.push(`/purchases?supplierId=${supplierId}`)}
              className={PROFILE_BUTTON_SECONDARY}
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">receipt_long</span>
              Record Payment
            </button>
            <button
              type="button"
              onClick={() => router.push(`/purchases/create?supplierId=${supplierId}`)}
              className={PROFILE_BUTTON_PRIMARY}
            >
              <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
              Create Purchase
            </button>
          </div>
        </div>
      </section>

      <SupplierDetailSummary financials={financials} />

      <div className="flex flex-col gap-3">
        <ProfileTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === "purchase" ? (
          <SupplierPurchaseLedger
            purchases={profile.purchases}
            totalCount={financials.purchaseOrders}
          />
        ) : null}

        {activeTab === "payments" ? (
          profile.payments.length === 0 ? (
            <div className={PROFILE_CARD}>
              <ProfileEmptyState
                compact
                icon="payments"
                title="No payments recorded for this supplier yet."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {profile.payments.map((payment) => (
                <div
                  key={payment.id}
                  className={`${PROFILE_CARD} ${PROFILE_TABLE_ROW} flex flex-wrap items-center justify-between gap-2 px-3.5 py-3`}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="font-body-medium text-body-medium text-on-surface">
                      {payment.title}
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                      {payment.detail}
                    </span>
                  </div>
                  <span className={`${PROFILE_NUMERIC} text-secondary`}>{payment.date}</span>
                </div>
              ))}
            </div>
          )
        ) : null}

        {activeTab === "invoices" ? (
          profile.invoices.length === 0 ? (
            <div className={PROFILE_CARD}>
              <ProfileEmptyState
                compact
                icon="receipt_long"
                title="No invoices recorded for this supplier yet."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {profile.invoices.map((purchase) => (
                <div
                  key={purchase.id}
                  className={`${PROFILE_CARD} ${PROFILE_TABLE_ROW} flex flex-wrap items-center justify-between gap-2 px-3.5 py-3`}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className={PROFILE_ID_TOKEN}>{purchase.id}</span>
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                      {purchase.date} · {purchase.reference}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProfileBadge tone="neutral">{purchase.status}</ProfileBadge>
                    <span className={`${PROFILE_NUMERIC} font-medium`}>
                      {formatRs(purchase.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}

        {activeTab === "contact" ? (
          <SupplierMasterProfile
            vendorCode={header.vendorCode}
            rows={profile.masterProfile}
          />
        ) : null}
      </div>
    </div>
  );
}
