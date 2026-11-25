"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { deleteSupplier, fetchSuppliers } from "../services/supplier.service";
import type {
  PayableFilter,
  RegionFilter,
  SortOption,
  StatusFilter,
  Supplier,
  SupplierSummary,
} from "../types";
import {
  downloadCsv,
  filterSuppliers,
  getSupplierSummary,
  sortSuppliers,
  suppliersToCsv,
} from "../utils";
import { DeleteSupplierDialog } from "./DeleteSupplierDialog";
import { EditSupplierDialog } from "./EditSupplierDialog";
import { SupplierFilters as SupplierFiltersBar } from "./SupplierFilters";
import { SupplierKpis } from "./SupplierKpis";
import { SuppliersFooter } from "./SuppliersFooter";
import { SuppliersHeader } from "./SuppliersHeader";
import { SuppliersTable } from "./SuppliersTable";

const EMPTY_SUMMARY: SupplierSummary = {
  total: 0,
  active: 0,
  onHold: 0,
  inactive: 0,
  newThisMonth: 0,
  totalPayable: 0,
  overdue: 0,
  overdueAmount: 0,
};

export function SuppliersView() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [summary, setSummary] = useState<SupplierSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [payable, setPayable] = useState<PayableFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [region, setRegion] = useState<RegionFilter>("all");
  const [sort, setSort] = useState<SortOption>("payable-desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchSuppliers();
        if (!cancelled) {
          setSuppliers(data);
          setSummary(getSupplierSummary(data));
          setError(null);

          const editId = new URLSearchParams(window.location.search).get("edit");
          if (editId) {
            const target = data.find((supplier) => supplier.id === editId);
            if (target) setEditingSupplier(target);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load suppliers. Please try again."
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
  }, []);

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

  const filteredSuppliers = useMemo(
    () =>
      sortSuppliers(
        filterSuppliers(suppliers, { query, payable, status, region, sort }),
        sort
      ),
    [suppliers, query, payable, status, region, sort]
  );

  const filteredPayable = useMemo(
    () => filteredSuppliers.reduce((sum, supplier) => sum + supplier.outstanding, 0),
    [filteredSuppliers]
  );

  const total = summary.total;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const start = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, total);

  function toggleRow(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  function toggleAll() {
    const visibleIds = filteredSuppliers.map((supplier) => supplier.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  }

  function handleExport() {
    if (filteredSuppliers.length === 0) {
      setNotice("No supplier records to export.");
      return;
    }
    downloadCsv(
      `suppliers-${new Date().toISOString().slice(0, 10)}.csv`,
      suppliersToCsv(filteredSuppliers)
    );
    setNotice(`Exported ${filteredSuppliers.length} supplier records to CSV.`);
  }

  function applySupplierList(next: Supplier[]) {
    setSuppliers(next);
    setSummary(getSupplierSummary(next));
  }

  function handleOpenProfile(supplier: Supplier) {
    setOpenMenuId(null);
    router.push(`/suppliers/${supplier.id}`);
  }

  function handleEdit(supplier: Supplier) {
    setOpenMenuId(null);
    setEditingSupplier(supplier);
  }

  function handleDelete(supplier: Supplier) {
    setOpenMenuId(null);
    setDeletingSupplier(supplier);
  }

  function handleSupplierSaved(updated: Supplier) {
    applySupplierList(
      suppliers.map((supplier) => (supplier.id === updated.id ? updated : supplier))
    );
    setEditingSupplier(null);
    setNotice(`Supplier ${updated.name} updated.`);
  }

  async function confirmSupplierDelete() {
    if (!deletingSupplier) return;

    const deleted = deletingSupplier;
    await deleteSupplier(deleted.id);
    applySupplierList(suppliers.filter((supplier) => supplier.id !== deleted.id));
    setSelectedIds((current) => current.filter((id) => id !== deleted.id));
    setDeletingSupplier(null);
    setNotice(`Supplier ${deleted.name} deleted.`);
  }

  function handleMenuAction(action: string, supplier: Supplier) {
    setOpenMenuId(null);
    setNotice(`${action}: ${supplier.name}`);
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <SuppliersHeader
        onExport={handleExport}
        onAgingLedger={() => setNotice("Aging ledger view is not connected yet.")}
        onAddSupplier={() => router.push("/suppliers/add")}
      />

      <SupplierKpis summary={summary} />

      <SupplierFiltersBar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        searchRef={searchRef}
        payable={payable}
        onPayableChange={(value) => {
          setPayable(value);
          setPage(1);
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        region={region}
        onRegionChange={(value) => {
          setRegion(value);
          setPage(1);
        }}
        sort={sort}
        onSortChange={(value) => {
          setSort(value);
          setPage(1);
        }}
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onRecordPayment={() => setNotice("Record Payment is not connected yet.")}
        onSendStatement={() => setNotice("Send Statement is not connected yet.")}
      />

      {loading ? (
        <div className="flex min-h-[580px] items-center justify-center rounded-xl border border-outline-variant/80 bg-surface-container-lowest font-body-medium text-body-medium text-on-surface-variant shadow-panel">
          Loading suppliers...
        </div>
      ) : error ? (
        <div className="flex min-h-[580px] flex-col items-center justify-center gap-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-6 text-center shadow-panel">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-error-container/50 text-error">
            <span className="material-symbols-outlined text-[24px]">error_outline</span>
          </span>
          <div className="font-body-medium text-body-medium text-on-surface">{error}</div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-9 rounded-lg bg-primary px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Retry
          </button>
        </div>
      ) : (
        <SuppliersTable
          suppliers={filteredSuppliers}
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          openMenuId={openMenuId}
          onMenuToggle={(id) => setOpenMenuId((current) => (current === id ? null : id))}
          onOpenProfile={handleOpenProfile}
          onCreatePurchase={(supplier) => handleMenuAction("Create Purchase", supplier)}
          onRecordPayment={(supplier) => handleMenuAction("Record Payment", supplier)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <SuppliersFooter
        start={start}
        end={end}
        total={total}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(1);
        }}
        filteredPayable={filteredPayable}
        overdueCount={summary.overdue}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-outline-variant/80 border-l-2 border-l-primary bg-surface-container-low px-4 py-3 text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">
            verified_user
          </span>
          <span className="font-body-dense text-body-dense text-on-surface">
            Karachi &amp; Lahore Clearing House automated reconciliation synced at 04:30 PM today.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            TAX STATUS: FBR SALES TAX REGISTERED (100%)
          </span>
          <button
            type="button"
            onClick={() => setNotice("WHT ledger download is not connected yet.")}
            className="rounded font-body-dense text-body-dense font-medium text-primary transition duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Download Withholding Tax (WHT) Ledger →
          </button>
        </div>
      </div>

      {editingSupplier ? (
        <EditSupplierDialog
          supplier={editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onSaved={handleSupplierSaved}
        />
      ) : null}

      {deletingSupplier ? (
        <DeleteSupplierDialog
          supplier={deletingSupplier}
          onClose={() => setDeletingSupplier(null)}
          onConfirm={confirmSupplierDelete}
        />
      ) : null}

      {notice ? (
        <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-2.5 rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3.5 py-2.5 font-body-dense text-body-dense text-on-surface shadow-panel">
          <span className="material-symbols-outlined text-[17px] text-primary">info</span>
          {notice}
        </div>
      ) : null}
    </div>
  );
}
