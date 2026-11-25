"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  DATE_OPTIONS,
  PAYMENT_FILTERS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  type PaymentFilter,
  type PurchaseRecord,
} from "../purchaseData";
import {
  deletePurchase,
  fetchPurchases,
  receivePurchase,
  recordPurchasePayment,
  updatePurchaseStatus,
} from "../services/purchase.service";
import type { PurchaseDto, PurchasePaymentInput, PurchaseReceiveInput } from "../types";
import { matchesDateRange, matchesPaymentFilter, purchasesToCsv, toPurchaseRecord } from "../utils";
import { DeletePurchaseDialog } from "./DeletePurchaseDialog";
import { PurchaseDetailDialog } from "./PurchaseDetailDialog";
import { PurchasesFooter } from "./PurchasesFooter";
import { PurchasesHeader } from "./PurchasesHeader";
import { PurchasesSummary } from "./PurchasesSummary";
import { PurchasesTable } from "./PurchasesTable";
import { PurchasesToolbar } from "./PurchasesToolbar";
import { ReceivePurchaseDialog } from "./ReceivePurchaseDialog";
import { PurchaseReceiptsDialog } from "./PurchaseReceiptsDialog";
import { RecordPurchasePaymentDialog } from "./RecordPurchasePaymentDialog";

const ROWS_PER_PAGE = 10;

export function PurchasesView() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [todayIso, setTodayIso] = useState("");
  const [query, setQuery] = useState("");
  const [supplier, setSupplier] = useState("All Suppliers");
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [dateRange, setDateRange] = useState(DATE_OPTIONS[0]);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [payment, setPayment] = useState<PaymentFilter>(PAYMENT_FILTERS[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [detailPurchase, setDetailPurchase] = useState<PurchaseRecord | null>(null);
  const [paymentPurchase, setPaymentPurchase] = useState<PurchaseRecord | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseDto | null>(null);
  const [receiptHistoryPurchase, setReceiptHistoryPurchase] = useState<PurchaseDto | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PurchaseRecord | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [deletingPurchase, setDeletingPurchase] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const created = params.get("created");
      const updated = params.get("updated");
      if (created) setNotice(`Purchase ${created} saved successfully.`);
      else if (updated) setNotice(`Purchase ${updated} updated successfully.`);

      setTodayIso(new Date().toISOString().slice(0, 10));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const supplierId = new URLSearchParams(window.location.search).get("supplierId");
        const data = await fetchPurchases(supplierId || undefined);
        if (cancelled) return;
        setPurchases(data.map(toPurchaseRecord));
        if (supplierId && data.length > 0) {
          setSupplier(data[0].supplier.name);
        }
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load purchases");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const supplierOptions = useMemo(
    () => [
      "All Suppliers",
      ...Array.from(new Set(purchases.map((purchase) => purchase.supplier))).sort(),
    ],
    [purchases]
  );
  const activeSupplier = supplierOptions.includes(supplier) ? supplier : supplierOptions[0];

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = purchases.filter((purchase) => {
      if (activeSupplier !== "All Suppliers" && purchase.supplier !== activeSupplier) return false;
      if (status !== "All Statuses" && purchase.status !== status) return false;
      if (!matchesPaymentFilter(purchase, payment)) return false;
      if (!matchesDateRange(purchase, dateRange, todayIso)) return false;
      if (!term) return true;

      return [
        purchase.id,
        purchase.supplier,
        purchase.account,
        purchase.date,
        purchase.invoiceNumber,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

    const sorted = [...rows];
    if (sort === "Sort: Date (Oldest first)") {
      sorted.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    } else if (sort === "Sort: Total Amount (High → Low)") {
      sorted.sort((a, b) => b.total - a.total);
    } else if (sort === "Sort: Remaining Balance (High → Low)") {
      sorted.sort((a, b) => b.remaining - a.remaining);
    } else if (sort === "Sort: Supplier (A-Z)") {
      sorted.sort((a, b) => a.supplier.localeCompare(b.supplier));
    } else {
      sorted.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
    }

    return sorted;
  }, [activeSupplier, dateRange, payment, purchases, query, sort, status, todayIso]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedPurchases = filtered.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  function applyUpdatedPurchase(dto: PurchaseDto) {
    const updated = toPurchaseRecord(dto);
    setPurchases((current) => {
      const exists = current.some((purchase) => purchase.id === updated.id);
      return exists
        ? current.map((purchase) => (purchase.id === updated.id ? updated : purchase))
        : [updated, ...current];
    });
    setDetailPurchase((current) => (current?.id === updated.id ? updated : current));
    setPaymentPurchase((current) => (current?.id === updated.id ? updated : current));
  }

  function toggleRow(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleAll() {
    const visibleIds = pagedPurchases.map((purchase) => purchase.id);
    setSelectedIds((current) =>
      visibleIds.every((id) => current.includes(id)) ? [] : visibleIds
    );
  }

  function handleExport() {
    if (filtered.length === 0) {
      setNotice("No purchases to export for this view.");
      return;
    }

    const csv = purchasesToCsv(filtered);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `purchases-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${filtered.length} purchase record${filtered.length === 1 ? "" : "s"}.`);
  }

  function openSupplierProfile(purchase: PurchaseRecord) {
    const supplierId = purchase.supplierId || purchase.dto.supplier?.id;
    if (!supplierId) {
      setNotice("This purchase does not have a linked supplier profile.");
      return;
    }
    router.push(`/suppliers/${supplierId}`);
  }

  async function handleAction(action: string, purchase: PurchaseRecord) {
    setOpenMenuId(null);

    if (action === "View PO") {
      setDetailPurchase(purchase);
      return;
    }
    if (action === "View Receipt History") {
      setReceiptHistoryPurchase(purchase.dto);
      return;
    }
    if (action === "Receive Goods (GRN)") {
      if (purchase.status === "Cancelled") {
        setNotice("Cancelled purchases cannot receive goods.");
        return;
      }
      setReceiveTarget(purchase.dto);
      return;
    }
    if (action === "Record Payment") {
      setPaymentPurchase(purchase);
      return;
    }
    if (action === "Edit Purchase") {
      router.push(`/purchases/create?edit=${encodeURIComponent(purchase.id)}`);
      return;
    }
    if (action === "Delete Purchase") {
      setPendingDelete(purchase);
      return;
    }

    if (action !== "Cancel Purchase") return;

    try {
      setActionLoading(true);
      const updated = await updatePurchaseStatus(purchase.id, "Cancelled");
      applyUpdatedPurchase(updated);
      setNotice(`${purchase.id} cancelled.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to update purchase");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePaymentConfirm(
    purchase: PurchaseRecord,
    payload: PurchasePaymentInput
  ) {
    try {
      setPaymentSaving(true);
      const updated = await recordPurchasePayment(purchase.id, payload);
      applyUpdatedPurchase(updated);
      setPaymentPurchase(null);
      setNotice(`Payment recorded against ${purchase.id}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to record payment");
    } finally {
      setPaymentSaving(false);
    }
  }

  async function handleReceiveConfirm(
    purchase: PurchaseDto,
    payload: PurchaseReceiveInput
  ) {
    try {
      setReceiving(true);
      const updated = await receivePurchase(purchase.purchaseNumber, payload);
      applyUpdatedPurchase(updated);
      setReceiveTarget(null);
      setDetailPurchase((current) => (current?.id === updated.purchaseNumber ? toPurchaseRecord(updated) : current));
      setNotice(`${purchase.purchaseNumber} goods receipt recorded. Stock updated.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to record goods receipt");
    } finally {
      setReceiving(false);
    }
  }

  async function handleDeleteConfirm(purchase: PurchaseRecord) {
    try {
      setDeletingPurchase(true);
      await deletePurchase(purchase.id);
      setPurchases((current) => current.filter((item) => item.id !== purchase.id));
      setSelectedIds((current) => current.filter((id) => id !== purchase.id));
      setDetailPurchase((current) => (current?.id === purchase.id ? null : current));
      setPaymentPurchase((current) => (current?.id === purchase.id ? null : current));
      setPendingDelete(null);
      setNotice(`${purchase.id} deleted successfully.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to delete purchase");
    } finally {
      setDeletingPurchase(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PurchasesHeader
        recordedCount={purchases.length}
        onExport={handleExport}
        onUpload={() => setNotice("Upload Supplier Invoice is not connected yet.")}
        onCreate={() => router.push("/purchases/create")}
      />

      <PurchasesSummary purchases={purchases} />

      {loadError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-error/25 bg-error-container/20 px-4 py-3 font-body-default text-body-default text-on-error-container shadow-panel">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setReloadKey((current) => current + 1);
            }}
            className="h-8 rounded-lg border border-error/30 bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-error-container transition duration-200 hover:bg-error-container/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Retry
          </button>
        </div>
      ) : null}

      <PurchasesToolbar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        supplier={activeSupplier}
        onSupplierChange={(value) => {
          setSupplier(value);
          setPage(1);
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value as typeof status);
          setPage(1);
        }}
        dateRange={dateRange}
        onDateRangeChange={(value) => {
          setDateRange(value);
          setPage(1);
        }}
        sort={sort}
        onSortChange={setSort}
        payment={payment}
        onPaymentChange={(value) => {
          setPayment(value);
          setPage(1);
        }}
        supplierOptions={supplierOptions}
      />

      {loading ? (
        <div className="rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-4 py-12 text-center font-body-default text-body-default text-on-surface-variant shadow-panel">
          Loading saved purchases…
        </div>
      ) : null}

      <PurchasesTable
        purchases={pagedPurchases}
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        openMenuId={openMenuId}
        onMenuToggle={(id) => setOpenMenuId((current) => (current === id ? null : id))}
        onAction={handleAction}
        onOpenSupplierProfile={openSupplierProfile}
      />

      <PurchasesFooter
        totalCount={filtered.length}
        visibleCount={pagedPurchases.length}
        selectedCount={selectedIds.length}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageAction={(label) => setNotice(`${label} is not connected yet.`)}
      />

      <PurchaseDetailDialog purchase={detailPurchase} onClose={() => setDetailPurchase(null)} />
      <PurchaseReceiptsDialog
        purchase={receiptHistoryPurchase}
        onClose={() => setReceiptHistoryPurchase(null)}
      />
      <ReceivePurchaseDialog
        key={receiveTarget?.purchaseNumber || "none"}
        purchase={receiveTarget}
        saving={receiving}
        onClose={() => setReceiveTarget(null)}
        onConfirm={handleReceiveConfirm}
      />
      <RecordPurchasePaymentDialog
        purchase={paymentPurchase}
        saving={paymentSaving}
        onClose={() => setPaymentPurchase(null)}
        onConfirm={handlePaymentConfirm}
      />
      <DeletePurchaseDialog
        purchase={pendingDelete}
        deleting={deletingPurchase}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

      {actionLoading ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-overlay/20">
          <div className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest px-5 py-3 font-body-medium text-body-medium text-on-surface shadow-panel">
            Updating purchase…
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-4 py-3 font-body-default text-body-default text-on-surface shadow-panel">
          {notice}
        </div>
      ) : null}
    </div>
  );
}
