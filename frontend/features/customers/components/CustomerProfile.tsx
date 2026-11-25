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

type CustomerProfileProps = {
  customerId: string;
};

type ProfileTab = "overview" | "orders" | "invoices" | "payments" | "returns" | "notes";

const TABS: Array<{ value: ProfileTab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "orders", label: "Orders" },
  { value: "invoices", label: "Invoices" },
  { value: "payments", label: "Payments" },
  { value: "returns", label: "Returns & Credit Notes" },
  { value: "notes", label: "Notes & Activity" },
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
      <div className="flex flex-col gap-3">
        <div className="h-[70px] animate-pulse rounded border border-outline-variant bg-surface-container-lowest" />
        <div className="h-[180px] animate-pulse rounded border border-outline-variant bg-surface-container-lowest" />
        <div className="h-[520px] animate-pulse rounded border border-outline-variant bg-surface-container-lowest" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded border border-outline-variant bg-surface-container-lowest p-6 text-center">
        <span className="material-symbols-outlined text-[28px] text-error">error_outline</span>
        <p className="font-body-medium text-body-medium text-on-surface">
          {error || "Customer not found"}
        </p>
        <button
          type="button"
          onClick={reload}
          className="h-[34px] rounded bg-primary px-4 font-body-medium text-body-medium text-on-primary transition-colors hover:bg-primary-hover"
        >
          Retry
        </button>
      </div>
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
      <nav className="flex flex-wrap items-center gap-2 font-mono-data-sm text-mono-data-sm text-secondary">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="transition-colors hover:text-primary"
        >
          Wholesale Operations
        </button>
        <span className="text-outline-variant">/</span>
        <button
          type="button"
          onClick={() => router.push("/customers")}
          className="transition-colors hover:text-primary"
        >
          Customers
        </button>
        <span className="text-outline-variant">/</span>
        <span className="font-body-medium text-on-surface">{customer.business}</span>
        <span className="ml-1 rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          Account #{customer.code} · {customer.cityLabel}
        </span>
      </nav>

      <div className="flex flex-col gap-4 pb-1 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
              {customer.business}
            </h1>
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${getStatusBadgeClasses(
                customer.status
              )}`}
            >
              {customer.status}
            </span>
            <span className="rounded border border-outline-variant bg-surface-container-high px-2 py-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
              {customer.ntn ? "KYC Verified" : "KYC Pending"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-default text-body-default text-on-surface-variant">
            <span className="flex items-center gap-1.5 text-on-surface">
              <span className="material-symbols-outlined text-[17px] text-secondary">person</span>
              <span className="font-body-medium">{customer.name}</span>
              <span className="text-body-dense text-secondary">(Proprietor)</span>
            </span>
            <span className="text-outline-variant">·</span>
            <span className="flex items-center gap-1.5 font-mono-data text-mono-data">
              <span className="material-symbols-outlined text-[17px] text-secondary">call</span>
              {customer.phone}
            </span>
            <span className="text-outline-variant">·</span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[17px] text-secondary">store</span>
              {customer.cityLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-row-hover"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </button>
          <button
            type="button"
            onClick={handleRecordPaymentClick}
            className="flex h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[17px] text-secondary">payments</span>
            Record Payment
          </button>
          <button
            type="button"
            onClick={() => setCreatingSale(true)}
            className="flex h-[34px] items-center gap-1.5 rounded bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-sm transition-colors hover:bg-primary-hover active:bg-primary-hover"
          >
            <span className="material-symbols-outlined text-[17px]">add_shopping_cart</span>
            Create Sale
          </button>
          <button
            type="button"
            onClick={() => setDeleting(true)}
            title="Delete customer"
            aria-label="Delete customer"
            className="flex h-[34px] w-[34px] items-center justify-center rounded border border-outline-variant bg-surface-container-lowest text-error transition-colors hover:bg-error-container/30"
          >
            <span className="material-symbols-outlined text-[17px]">delete</span>
          </button>
        </div>
      </div>

      {notice ? (
        <div className="rounded border border-outline-variant bg-surface-container px-3 py-2 font-mono-data-sm text-mono-data-sm text-secondary">
          {notice}
        </div>
      ) : null}

      <CustomerProfileSummary customer={customer} orders={orders} />

      <div className="flex items-center gap-1 overflow-x-auto border-b border-outline-variant">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2 font-body-default transition-colors ${
              activeTab === tab.value
                ? "border-primary-container font-body-medium text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span>{tab.label}</span>
            {tab.value === "orders" ? (
              <span className="rounded bg-surface-container-highest px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm font-semibold text-primary">
                {customer.orders}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
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
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded border border-outline-variant bg-surface-container-lowest p-6 text-center">
              <span className="material-symbols-outlined text-[28px] text-secondary">
                assignment_return
              </span>
              <div className="mt-2 font-body-medium text-body-medium text-on-surface">
                No returns or credit notes recorded
              </div>
              <div className="mt-1 font-body-dense text-body-dense text-secondary">
                This section stays empty until matching records are saved for the customer.
              </div>
            </div>
          ) : null}

        </div>

        <div className="xl:col-span-4">
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

function getStatusBadgeClasses(status: string): string {
  if (status === "Active") {
    return "border border-success-border bg-success-container text-success";
  }
  if (status === "Blocked") {
    return "border border-error/20 bg-error-container/50 text-error";
  }
  return "border border-outline-variant bg-surface-container text-on-surface-variant";
}
