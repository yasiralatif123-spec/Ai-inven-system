"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomerProfile } from "../hooks/useCustomerProfile";
import { deleteCustomer } from "../services/customer.service";
import { NewOrderDialog } from "../../sales-orders/components/NewOrderDialog";
import { RecordPaymentDialog } from "../../sales-orders/components/RecordPaymentDialog";
import {
  createSaleOrder,
  recordSaleOrderPayment,
} from "../../sales-orders/services/sale-order.service";
import type { DraftOrderInput, PaymentInput, SalesOrder } from "../../sales-orders/types";
import { CustomerAccountDossier } from "./CustomerAccountDossier";
import { CustomerInvoices } from "./CustomerInvoices";
import { CustomerNotes } from "./CustomerNotes";
import { CustomerOrdersLedger } from "./CustomerOrdersLedger";
import { CustomerPayments } from "./CustomerPayments";
import { CustomerProfileSummary } from "./CustomerProfileSummary";
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";
import { EditCustomerDialog } from "./EditCustomerDialog";
import {
  PROFILE_BUTTON_DANGER_ICON,
  PROFILE_BUTTON_PRIMARY,
  PROFILE_BUTTON_SECONDARY,
  PROFILE_CARD,
  PROFILE_ID_TOKEN,
  ProfileBadge,
  ProfileEmptyState,
  ProfileErrorState,
  ProfileLoadingState,
  ProfileMetaItem,
  ProfileTabs,
} from "../../profiles/profile-ui";

type CustomerProfileProps = {
  customerId: string;
};

type ProfileTab = "overview" | "orders" | "invoices" | "payments" | "returns" | "notes";

const TABS: Array<{ value: ProfileTab; label: string; icon: string }> = [
  { value: "overview", label: "Overview", icon: "dashboard" },
  { value: "orders", label: "Orders", icon: "shopping_bag" },
  { value: "invoices", label: "Invoices", icon: "description" },
  { value: "payments", label: "Payments", icon: "payments" },
  { value: "returns", label: "Returns & Credit Notes", icon: "assignment_return" },
  { value: "notes", label: "Notes & Activity", icon: "notes" },
];

export function CustomerProfile({ customerId }: CustomerProfileProps) {
  const router = useRouter();
  const { customer, orders, loading, error, reload } = useCustomerProfile(customerId);
  const [activeTab, setActiveTab] = useState<ProfileTab>("orders");
  const [editing, setEditing] = useState(false);
  const [creatingSale, setCreatingSale] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  if (loading) {
    return (
      <ProfileLoadingState
        label="Loading customer profile..."
        detail={`Customer ID: ${customerId}`}
      />
    );
  }

  if (error || !customer) {
    return (
      <ProfileErrorState
        message={error || "Customer not found"}
        onRetry={reload}
      />
    );
  }

  const currentCustomerId = customer.id;
  const payableOrders = orders.filter((order) => order.financials.outstanding > 0);
  const paymentOrder = orders.find((order) => order.id === paymentOrderId) ?? null;

  function handleViewOrder(order: SalesOrder) {
    router.push(`/sales-orders?order=${encodeURIComponent(order.id)}`);
  }

  function handleRecordPaymentClick() {
    if (payableOrders.length === 0) {
      setNotice("No outstanding orders are waiting for payment.");
      return;
    }
    setPaymentOrderId(payableOrders[0].id);
  }

  async function handleRecordPayment(input: PaymentInput) {
    if (!paymentOrder) return;
    await recordSaleOrderPayment(paymentOrder.id, input);
    setPaymentOrderId(null);
    reload();
  }

  async function handleCreateSale(input: DraftOrderInput) {
    await createSaleOrder(input);
    setCreatingSale(false);
    reload();
  }

  async function handleDeleteCustomer() {
    await deleteCustomer(currentCustomerId);
    setDeleting(false);
    router.push("/customers");
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
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
          onClick={() => router.push("/customers")}
          className="transition-colors hover:text-primary"
        >
          Customers
        </button>
        <span className="material-symbols-outlined text-[13px] text-outline-variant">chevron_right</span>
        <span className="font-body-medium text-on-surface">{customer.business}</span>
        <span className={PROFILE_ID_TOKEN}>
          Account #{customer.code} · {customer.cityLabel}
        </span>
      </nav>

      <section className={`${PROFILE_CARD} p-4`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container font-headline-md text-headline-md font-semibold text-primary">
              {(customer.business || customer.name || "?").slice(0, 1).toUpperCase()}
            </span>

            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
                  {customer.business}
                </h1>
                <ProfileBadge
                  tone={
                    customer.status === "Active"
                      ? "success"
                      : customer.status === "Blocked"
                        ? "error"
                        : "neutral"
                  }
                >
                  {customer.status}
                </ProfileBadge>
                {customer.type ? <ProfileBadge tone="neutral">{customer.type}</ProfileBadge> : null}
                <ProfileBadge tone={customer.ntn ? "success" : "neutral"}>
                  {customer.ntn ? "KYC Verified" : "KYC Pending"}
                </ProfileBadge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <ProfileMetaItem icon="person">
                  <span className="font-body-medium text-on-surface">{customer.name}</span>
                  <span className="text-body-dense text-secondary"> (Proprietor)</span>
                </ProfileMetaItem>
                <ProfileMetaItem icon="call" mono>
                  {customer.phone}
                </ProfileMetaItem>
                <ProfileMetaItem icon="store">{customer.cityLabel}</ProfileMetaItem>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setEditing(true)} className={PROFILE_BUTTON_SECONDARY}>
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit
            </button>
            <button
              type="button"
              onClick={handleRecordPaymentClick}
              className={PROFILE_BUTTON_SECONDARY}
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">payments</span>
              Record Payment
            </button>
            <button
              type="button"
              onClick={() => setCreatingSale(true)}
              className={PROFILE_BUTTON_PRIMARY}
            >
              <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
              Create Sale
            </button>
            <button
              type="button"
              onClick={() => setDeleting(true)}
              title="Delete customer"
              aria-label="Delete customer"
              className={PROFILE_BUTTON_DANGER_ICON}
            >
              <span className="material-symbols-outlined text-[17px]">delete</span>
            </button>
          </div>
        </div>
      </section>

      {notice ? (
        <div className={`${PROFILE_CARD} flex items-center gap-2 border-l-2 border-l-warning bg-warning-container/30 px-3 py-2 font-body-dense text-body-dense text-on-surface`}>
          <span className="material-symbols-outlined text-[16px] text-warning">info</span>
          {notice}
        </div>
      ) : null}

      <CustomerProfileSummary customer={customer} orders={orders} />

      <ProfileTabs tabs={TABS.map((tab) => ({
        ...tab,
        count: tab.value === "orders" ? customer.orders : undefined,
      }))} active={activeTab} onChange={setActiveTab} />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          {activeTab === "orders" || activeTab === "overview" ? (
            <CustomerOrdersLedger orders={orders} onViewOrder={handleViewOrder} />
          ) : null}

          {activeTab === "invoices" ? (
            <CustomerInvoices
              orders={orders}
              onViewOrder={handleViewOrder}
              onPay={(order) => setPaymentOrderId(order.id)}
            />
          ) : null}

          {activeTab === "payments" ? (
            <CustomerPayments orders={orders} onViewOrder={handleViewOrder} />
          ) : null}

          {activeTab === "notes" ? <CustomerNotes customer={customer} orders={orders} /> : null}

          {activeTab === "returns" ? (
            <div className={PROFILE_CARD}>
              <ProfileEmptyState
                icon="assignment_return"
                title="No returns or credit notes recorded"
                description="This section stays empty until matching records are saved for the customer."
              />
            </div>
          ) : null}
        </div>

        <div className="xl:sticky xl:top-4 xl:col-span-4">
          <CustomerAccountDossier customer={customer} orders={orders} />
        </div>
      </div>

      {editing ? (
        <EditCustomerDialog
          customer={customer}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reload();
          }}
        />
      ) : null}

      {creatingSale ? (
        <NewOrderDialog
          onClose={() => setCreatingSale(false)}
          onSubmit={handleCreateSale}
          initialCustomer={{
            name: customer.business || customer.name,
            phone: customer.phone,
            location: customer.address || customer.cityLabel,
          }}
        />
      ) : null}

      {paymentOrder ? (
        <RecordPaymentDialog
          order={paymentOrder}
          onClose={() => setPaymentOrderId(null)}
          onSubmit={handleRecordPayment}
        />
      ) : null}

      {deleting ? (
        <DeleteCustomerDialog
          customer={customer}
          onClose={() => setDeleting(false)}
          onConfirm={handleDeleteCustomer}
        />
      ) : null}
    </div>
  );
}
