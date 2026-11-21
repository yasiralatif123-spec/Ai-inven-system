"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCustomers } from "../../customers/services/customer.service";
import type { Customer } from "../../customers/types";
import { findCustomerForOrder } from "../../customers/utils";
import {
  createSaleOrder,
  deleteSaleOrder,
  fetchSaleOrders,
  recordSaleOrderPayment,
  updateSaleOrder,
} from "../services/sale-order.service";
import type {
  DateFilter,
  DraftOrderInput,
  HubFilter,
  PaymentFilter,
  PaymentInput,
  SalesOrder,
  StatusFilter,
} from "../types";
import {
  downloadCsv,
  filterOrders,
  getSalesKpis,
  getStatusCounts,
  ordersToCsv,
} from "../utils";
import { DeleteOrderDialog } from "./DeleteOrderDialog";
import { EditOrderDialog } from "./EditOrderDialog";
import { NewOrderDialog } from "./NewOrderDialog";
import { OrdersTable } from "./OrdersTable";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { SalesFilters } from "./SalesFilters";
import { SalesKpis } from "./SalesKpis";
import { SalesOrdersHeader } from "./SalesOrdersHeader";

export function SalesOrdersView() {
  const router = useRouter();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [hubFilter, setHubFilter] = useState<HubFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All Orders");
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [newOrderDialogKey, setNewOrderDialogKey] = useState(0);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<SalesOrder | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [data, customerData] = await Promise.all([
          fetchSaleOrders(),
          fetchCustomers().catch(() => [] as Customer[]),
        ]);
        if (cancelled) return;

        setOrders(data);
        setCustomers(customerData);

        const linkedOrderId = new URLSearchParams(window.location.search).get("order");
        if (linkedOrderId) {
          const linkedOrder = data.find((order) => order.id === linkedOrderId);
          if (linkedOrder) setEditingOrder(linkedOrder);
          else setNotice(`Order ${linkedOrderId} was not found.`);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load sale orders. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    // Dashboard "Create Sale" links here with ?new=1.
    if (new URLSearchParams(window.location.search).get("new") !== "1") return;

    const timeout = window.setTimeout(() => {
      setNewOrderDialogKey((key) => key + 1);
      setNewOrderOpen(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const filteredOrders = useMemo(
    () =>
      filterOrders(orders, {
        query,
        status: statusFilter,
        payment: paymentFilter,
        date: dateFilter,
        hub: hubFilter,
      }),
    [orders, query, statusFilter, paymentFilter, dateFilter, hubFilter]
  );
  const kpis = useMemo(() => getSalesKpis(orders), [orders]);
  const statusCounts = useMemo(() => getStatusCounts(orders), [orders]);

  const paymentOrder = orders.find((order) => order.id === paymentOrderId) ?? null;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNewOrderOpen(false);
        setEditingOrder(null);
        setDeletingOrder(null);
        setPaymentOrderId(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function openNewOrder() {
    setNewOrderDialogKey((key) => key + 1);
    setNewOrderOpen(true);
  }

  function handleOpenCustomer(order: SalesOrder) {
    if (order.customerId) {
      router.push(`/customers/${encodeURIComponent(order.customerId)}`);
      return;
    }

    const customer = findCustomerForOrder(customers, order);
    if (!customer) {
      setNotice(`No saved customer profile matches ${order.customer}.`);
      return;
    }
    router.push(`/customers/${customer.id}`);
  }

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`sales-orders-${date}.csv`, ordersToCsv(filteredOrders));
  }

  async function handleCreateOrder(input: DraftOrderInput) {
    const created = await createSaleOrder(input);
    setOrders((current) => [created, ...current]);
    setStatusFilter("All Orders");
    setPaymentFilter("all");
    setDateFilter("all");
    setHubFilter("all");
    setQuery("");
    setError(null);
    setNewOrderOpen(false);
  }

  async function handleUpdateOrder(input: DraftOrderInput) {
    if (!editingOrder) return;
    const updated = await updateSaleOrder(editingOrder.id, input);
    setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
    setError(null);
    setEditingOrder(null);
  }

  async function handleDeleteOrder() {
    if (!deletingOrder) return;
    const deletedId = deletingOrder.id;
    await deleteSaleOrder(deletedId);
    const remaining = orders.filter((order) => order.id !== deletedId);
    setOrders(remaining);
    setError(null);
    setDeletingOrder(null);
  }

  async function handleRecordPayment(input: PaymentInput) {
    if (!paymentOrder) return;
    const updated = await recordSaleOrderPayment(paymentOrder.id, input);
    setOrders((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
    setError(null);
    setPaymentOrderId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <SalesOrdersHeader onExport={handleExport} onNewOrder={openNewOrder} />
      <SalesKpis data={kpis} />

      {error ? (
        <div className="flex items-center justify-between gap-3 rounded border border-error-container bg-error-container/40 px-3 py-2 font-mono-data-sm text-mono-data-sm text-error">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="shrink-0 font-body-medium text-body-dense underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {notice ? (
        <div className="rounded border border-outline-variant bg-surface-container px-3 py-2 font-mono-data-sm text-mono-data-sm text-secondary">
          {notice}
        </div>
      ) : null}

      <SalesFilters
        query={query}
        onQueryChange={setQuery}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
        hubFilter={hubFilter}
        onHubFilterChange={setHubFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusCounts={statusCounts}
      />

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded border border-outline-variant bg-surface-container-lowest font-mono-data-sm text-mono-data-sm text-secondary">
          Loading sale orders...
        </div>
      ) : (
        <OrdersTable
          key={`${query}-${statusFilter}-${paymentFilter}-${dateFilter}-${hubFilter}`}
          orders={filteredOrders}
          onEdit={setEditingOrder}
          onDelete={setDeletingOrder}
          onRecordPayment={setPaymentOrderId}
          onOpenCustomer={handleOpenCustomer}
        />
      )}

      {newOrderOpen ? (
        <NewOrderDialog
          key={newOrderDialogKey}
          onClose={() => setNewOrderOpen(false)}
          onSubmit={handleCreateOrder}
        />
      ) : null}
      {editingOrder ? (
        <EditOrderDialog
          key={editingOrder.id}
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSubmit={handleUpdateOrder}
        />
      ) : null}
      {deletingOrder ? (
        <DeleteOrderDialog
          order={deletingOrder}
          onClose={() => setDeletingOrder(null)}
          onConfirm={handleDeleteOrder}
        />
      ) : null}
      {paymentOrder ? (
        <RecordPaymentDialog
          order={paymentOrder}
          onClose={() => setPaymentOrderId(null)}
          onSubmit={handleRecordPayment}
        />
      ) : null}
    </div>
  );
}
