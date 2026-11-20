"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { deleteCustomer, fetchCustomers } from "../services/customer.service";
import type { BalanceFilter, Customer, CustomerSort } from "../types";
import {
  customersToCsv,
  downloadCsv,
  filterCustomers,
  getCustomerSummary,
  sortCustomers,
} from "../utils";
import { CustomerFilters } from "./CustomerFilters";
import { CustomerKpis } from "./CustomerKpis";
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";
import { EditCustomerDialog } from "./EditCustomerDialog";
import { CustomersFooter } from "./CustomersFooter";
import { CustomersHeader } from "./CustomersHeader";
import { CustomersTable } from "./CustomersTable";

export function CustomersView() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [query, setQuery] = useState("");
  const [route, setRoute] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [balance, setBalance] = useState<BalanceFilter>("all");
  const [sort, setSort] = useState<CustomerSort>("outstanding-desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchCustomers();
        if (!cancelled) {
          setCustomers(data);
          setSelectedIds((current) => current.filter((id) => data.some((item) => item.id === id)));
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load customers. Please try again."
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
  }, [reloadToken]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const summary = useMemo(() => getCustomerSummary(customers), [customers]);

  const filteredCustomers = useMemo(
    () =>
      sortCustomers(
        filterCustomers(customers, { query, route, type, status, balance, sort }),
        sort
      ),
    [customers, query, route, type, status, balance, sort]
  );

  const filteredOutstanding = useMemo(
    () => filteredCustomers.reduce((sum, customer) => sum + customer.outstanding, 0),
    [filteredCustomers]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const start = filteredCustomers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, filteredCustomers.length);
  const pagedCustomers = filteredCustomers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  function resetPage<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
    setOpenMenuId(null);
  }

  function toggleRow(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  function toggleAll() {
    const visibleIds = pagedCustomers.map((customer) => customer.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  }

  function handleExport() {
    if (filteredCustomers.length === 0) {
      setNotice("No customer records to export.");
      return;
    }
    downloadCsv(
      `customers-${new Date().toISOString().slice(0, 10)}.csv`,
      customersToCsv(filteredCustomers)
    );
    setNotice(`Exported ${filteredCustomers.length} customer record(s) to CSV.`);
  }

  function handleCreateSale(customer: Customer) {
    setOpenMenuId(null);
    setNotice(`Opening a new sale order for ${customer.name}.`);
    router.push("/sales-orders?new=1");
  }

  function handleRecordPayment(customer: Customer) {
    setOpenMenuId(null);
    router.push("/sales-orders");
    setNotice(`Open a sale order for ${customer.name} to record a payment.`);
  }

  function handleOpenProfile(customer: Customer) {
    setOpenMenuId(null);
    router.push(`/customers/${customer.id}`);
  }

  function handleEdit(customer: Customer) {
    setOpenMenuId(null);
    setEditingCustomer(customer);
  }

  function handleDelete(customer: Customer) {
    setOpenMenuId(null);
    setDeletingCustomer(customer);
  }

  function handleCustomerSaved(updated: Customer) {
    setCustomers((current) => current.map((customer) => (customer.id === updated.id ? updated : customer)));
    setEditingCustomer(null);
    setNotice(`Customer ${updated.name} updated.`);
  }

  async function confirmCustomerDelete() {
    if (!deletingCustomer) return;

    const deleted = deletingCustomer;
    await deleteCustomer(deleted.id);
    setCustomers((current) => current.filter((customer) => customer.id !== deleted.id));
    setSelectedIds((current) => current.filter((id) => id !== deleted.id));
    setDeletingCustomer(null);
    setNotice(`Customer ${deleted.name} deleted.`);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-[86px] animate-pulse rounded border border-outline-variant bg-surface-container-lowest" />
        <div className="h-[110px] animate-pulse rounded border border-outline-variant bg-surface-container-lowest" />
        <div className="h-[560px] animate-pulse rounded border border-outline-variant bg-surface-container-lowest" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded border border-outline-variant bg-surface-container-lowest p-6 text-center">
        <span className="material-symbols-outlined text-[28px] text-error">error_outline</span>
        <p className="font-body-medium text-body-medium text-on-surface">{error}</p>
        <button
          type="button"
          onClick={() => setReloadToken((token) => token + 1)}
          className="h-[34px] rounded bg-primary-container px-4 font-body-medium text-body-medium text-on-primary transition-colors hover:bg-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <CustomersHeader
        onExport={handleExport}
        onAddCustomer={() => router.push("/customers/add")}
      />

      <CustomerKpis summary={summary} />

      <CustomerFilters
        query={query}
        onQueryChange={(value) => resetPage(setQuery, value)}
        searchRef={searchRef}
        route={route}
        onRouteChange={(value) => resetPage(setRoute, value)}
        type={type}
        onTypeChange={(value) => resetPage(setType, value)}
        status={status}
        onStatusChange={(value) => resetPage(setStatus, value)}
        balance={balance}
        onBalanceChange={(value) => resetPage(setBalance, value)}
        sort={sort}
        onSortChange={(value) => resetPage(setSort, value)}
      />

      <CustomersTable
        customers={pagedCustomers}
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        openMenuId={openMenuId}
        onMenuToggle={(id) => setOpenMenuId((current) => (current === id ? null : id))}
        onOpenProfile={handleOpenProfile}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateSale={handleCreateSale}
        onRecordPayment={handleRecordPayment}
      />

      <CustomersFooter
        start={start}
        end={end}
        total={filteredCustomers.length}
        filteredOutstanding={filteredOutstanding}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(1);
        }}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {editingCustomer ? (
        <EditCustomerDialog
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSaved={handleCustomerSaved}
        />
      ) : null}

      {deletingCustomer ? (
        <DeleteCustomerDialog
          customer={deletingCustomer}
          onClose={() => setDeletingCustomer(null)}
          onConfirm={confirmCustomerDelete}
        />
      ) : null}

      {notice ? (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-2 rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-dense text-body-dense text-on-surface shadow-lg"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">info</span>
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
            className="ml-1 text-secondary hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
