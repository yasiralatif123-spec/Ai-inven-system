"use client";

import { useEffect, useMemo, useState } from "react";
import { useBrands } from "../hooks/useBrands";
import { setBrandStatus } from "../services/brand.service";
import type { Brand, BrandSort, BrandStatusFilter } from "../types";
import { filterBrands, getBrandSummary, sortBrands } from "../utils";
import { BrandDetailDialog } from "./BrandDetailDialog";
import { BrandFilters } from "./BrandFilters";
import { BrandFormDialog } from "./BrandFormDialog";
import { BrandsFooter } from "./BrandsFooter";
import { BrandsHeader } from "./BrandsHeader";
import { BrandsTable } from "./BrandsTable";
import { BrandStatusDialog } from "./BrandStatusDialog";

type FormState = { open: boolean; brand: Brand | null };

export function BrandsView() {
  const { brands, loading, error, refresh } = useBrands();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BrandStatusFilter>("all");
  const [sort, setSort] = useState<BrandSort>("newest");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({ open: false, brand: null });
  const [detailBrand, setDetailBrand] = useState<Brand | null>(null);
  const [statusTarget, setStatusTarget] = useState<Brand | null>(null);
  const [busyBrandId, setBusyBrandId] = useState<string | null>(null);

  const summary = useMemo(() => getBrandSummary(brands), [brands]);
  const filtered = useMemo(
    () => sortBrands(filterBrands(brands, query, status), sort),
    [brands, query, status, sort]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pagedBrands = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function changeStatus(value: BrandStatusFilter) {
    setStatus(value);
    setPage(1);
  }

  function changeSort(value: BrandSort) {
    setSort(value);
    setPage(1);
  }

  function changeRowsPerPage(value: number) {
    setRowsPerPage(value);
    setPage(1);
  }

  function openAdd() {
    setActionError(null);
    setFormState({ open: true, brand: null });
  }

  function openEdit(brand: Brand) {
    setActionError(null);
    setDetailBrand(null);
    setFormState({ open: true, brand });
  }

  function handleSaved(brand: Brand, mode: "created" | "updated") {
    setFormState({ open: false, brand: null });
    setNotice(mode === "created" ? `Brand ${brand.name} created.` : `Brand ${brand.name} updated.`);
    setDetailBrand((current) => (current?._id === brand._id ? brand : current));
    refresh();
  }

  function requestStatus(brand: Brand) {
    setActionError(null);
    setStatusTarget(brand);
  }

  async function confirmStatus() {
    if (!statusTarget) return;
    const target = statusTarget;
    setBusyBrandId(target._id);
    setActionError(null);
    try {
      const updated = await setBrandStatus(target._id, !target.isActive);
      setStatusTarget(null);
      setDetailBrand((current) => (current?._id === updated._id ? updated : current));
      setNotice(
        updated.isActive
          ? `Brand ${updated.name} activated.`
          : `Brand ${updated.name} deactivated.`
      );
      refresh();
    } catch (statusError) {
      setActionError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update brand status"
      );
    } finally {
      setBusyBrandId(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-4 text-on-surface">
      <BrandsHeader total={summary.total} active={summary.active} onAdd={openAdd} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Brands", value: summary.total, icon: "sell" },
          { label: "Active", value: summary.active, icon: "check_circle" },
          { label: "Inactive", value: summary.inactive, icon: "toggle_off" },
          { label: "Product Links", value: summary.products, icon: "link" },
        ].map((card) => (
          <div
            key={card.label}
            className="flex min-h-[88px] flex-col justify-between rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-panel"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                {card.label}
              </span>
              <span className="material-symbols-outlined text-[18px] text-primary">
                {card.icon}
              </span>
            </div>
            <span className="font-metric-display text-metric-display tabular-nums text-on-surface">
              {card.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 font-body-default text-body-default text-error shadow-panel">
          <span>{error}</span>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-error/30 px-3 py-1.5 font-body-medium text-body-medium transition duration-200 hover:bg-error-container/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Retry
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 font-body-default text-body-default text-error shadow-panel">
          {actionError}
        </div>
      ) : null}

      <BrandFilters
        query={query}
        onQueryChange={changeQuery}
        status={status}
        onStatusChange={changeStatus}
        sort={sort}
        onSortChange={changeSort}
      />

      <BrandsTable
        brands={pagedBrands}
        loading={loading}
        busyBrandId={busyBrandId}
        onDetails={setDetailBrand}
        onEdit={openEdit}
        onToggleStatus={requestStatus}
      />

      <BrandsFooter
        total={filtered.length}
        page={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={changeRowsPerPage}
      />

      {formState.open ? (
        <BrandFormDialog
          brand={formState.brand}
          brands={brands}
          onClose={() => setFormState({ open: false, brand: null })}
          onSaved={handleSaved}
        />
      ) : null}

      {detailBrand ? (
        <BrandDetailDialog
          brand={detailBrand}
          busy={busyBrandId === detailBrand._id}
          onClose={() => setDetailBrand(null)}
          onEdit={openEdit}
          onToggleStatus={requestStatus}
        />
      ) : null}

      {statusTarget ? (
        <BrandStatusDialog
          brand={statusTarget}
          busy={busyBrandId === statusTarget._id}
          onClose={() => setStatusTarget(null)}
          onConfirm={confirmStatus}
        />
      ) : null}

      {notice ? (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-2.5 rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3.5 py-2.5 font-body-dense text-body-dense text-on-surface shadow-panel"
        >
          <span className="material-symbols-outlined text-[17px] text-primary">info</span>
          {notice}
        </div>
      ) : null}
    </div>
  );
}
