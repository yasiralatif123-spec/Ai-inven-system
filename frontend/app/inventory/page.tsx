"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../components/AppShell";
import type { Product } from "../products/types";
import { InventoryKpis } from "./components/InventoryKpis";
import { StockTable } from "./components/StockTable";
import { MovementsLedger } from "./components/MovementsLedger";
import { AdjustStockPanel } from "./components/AdjustStockPanel";
import { InventoryEmptyState } from "./components/InventoryEmptyState";
import type { StockMovementDto, StockRow } from "./data";
import {
  deleteStockMovement,
  fetchInventoryProducts,
  fetchStockMovements,
} from "./services/inventory.service";
import { formatFlavorLabel, formatNumber, movementToEntry, toStockRows } from "./utils";

function isToday(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toDateString() === new Date().toDateString();
}

const STATUS_PRIORITY: Record<StockRow["status"], number> = {
  critical: 0,
  low: 1,
  "in-stock": 2,
  optimal: 3,
};

type InventoryTab = "overview" | "movements" | "adjustments" | "transfers" | "alerts";

function isAlertRow(row: StockRow) {
  return row.status === "critical" || row.status === "low";
}

function refreshedStockRow(product: Product, previous: StockRow | null) {
  const options = toStockRows(product);
  return (
    options.find((row) =>
      previous?.flavor ? row.flavor === previous.flavor : !row.flavor
    ) ??
    options[0] ??
    null
  );
}

const ACTIVE_TAB_CLASS =
  "flex items-center gap-1.5 whitespace-nowrap rounded border border-outline-variant/60 bg-surface-container-lowest px-3 py-1.5 font-body-medium text-body-medium text-primary shadow-sm";
const INACTIVE_TAB_CLASS =
  "flex items-center gap-1.5 whitespace-nowrap rounded px-3 py-1.5 font-body-default text-body-default text-on-surface-variant transition-colors hover:text-on-surface";
const EMPTY_ACTION_CLASS =
  "rounded bg-primary-container px-3 py-1.5 font-body-medium text-body-medium font-semibold text-on-primary transition-colors hover:bg-primary";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [activeTab, setActiveTab] = useState<InventoryTab>("overview");
  const [adjustOpen, setAdjustOpen] = useState(true);
  const [selectedRow, setSelectedRow] = useState<StockRow | null>(null);
  const [query, setQuery] = useState("");
  const [depotFilter, setDepotFilter] = useState("all");
  const deepLinkHandled = useRef({ tab: false, product: false });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [productList, movementList] = await Promise.all([
          fetchInventoryProducts(),
          fetchStockMovements(),
        ]);
        if (!active) return;
        setProducts(productList);
        setMovements(movementList);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load inventory data"
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const rows = useMemo(() => products.flatMap(toStockRows), [products]);

  useEffect(() => {
    // Dashboard links can deep-link to a tab or open Adjust Stock for a product.
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab");
    const validTabs: InventoryTab[] = [
      "overview",
      "movements",
      "adjustments",
      "transfers",
      "alerts",
    ];
    const timeouts: number[] = [];

    if (
      requestedTab &&
      !deepLinkHandled.current.tab &&
      validTabs.includes(requestedTab as InventoryTab)
    ) {
      deepLinkHandled.current.tab = true;
      timeouts.push(
        window.setTimeout(() => setActiveTab(requestedTab as InventoryTab), 0)
      );
    }

    const requestedProduct = params.get("product");
    if (requestedProduct && !deepLinkHandled.current.product) {
      const row = rows.find((candidate) => candidate.productId === requestedProduct);
      if (row) {
        deepLinkHandled.current.product = true;
        timeouts.push(
          window.setTimeout(() => {
            setSelectedRow(row);
            setAdjustOpen(true);
            setActiveTab("overview");
          }, 0)
        );
      }
    }

    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout));
  }, [rows]);

  const depots = useMemo(
    () => Array.from(new Set(rows.map((row) => row.warehouse).filter(Boolean))).sort(),
    [rows]
  );
  const depotRows = useMemo(
    () => rows.filter((row) => depotFilter === "all" || row.warehouse === depotFilter),
    [rows, depotFilter]
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!normalizedQuery) return depotRows;
    return depotRows.filter((row) =>
      [row.name, row.sku, row.brand, row.location, row.warehouse].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [depotRows, normalizedQuery]);
  const depotAlertRows = useMemo(() => depotRows.filter(isAlertRow), [depotRows]);
  const alertRows = useMemo(() => filteredRows.filter(isAlertRow), [filteredRows]);

  const summary = useMemo(() => {
    return depotRows.reduce(
      (acc, row) => {
        acc.totalUnits += row.available;
        acc.reservedUnits += row.reserved;
        acc.stockValue += row.available * row.purchasePrice;
        if (row.status === "critical") acc.criticalCount += 1;
        if (row.status === "low") acc.lowCount += 1;
        return acc;
      },
      { totalUnits: 0, reservedUnits: 0, stockValue: 0, criticalCount: 0, lowCount: 0 }
    );
  }, [depotRows]);

  const movementEntries = useMemo(() => movements.map(movementToEntry), [movements]);
  const adjustmentEntries = useMemo(
    () => movementEntries.filter((entry) => entry.kind === "adjustment"),
    [movementEntries]
  );
  const todayMovements = useMemo(
    () => movements.filter((movement) => isToday(movement.createdAt)).length,
    [movements]
  );
  const adjustmentMovements = useMemo(
    () => movements.filter((movement) => movement.type === "adjustment").length,
    [movements]
  );

  const activeRow =
    selectedRow ??
    [...filteredRows].sort(
      (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
    )[0] ??
    rows[0] ??
    null;
  const alertCount = depotAlertRows.length;
  const depotLabel =
    depotFilter === "all" ? "ALL DEPOTS" : depotFilter.split(" (")[0];
  const depotPhrase = depotFilter === "all" ? "all depots" : depotLabel;
  const exportRows = activeTab === "alerts" ? alertRows : filteredRows;
  const tabs: Array<{
    key: InventoryTab;
    label: string;
    badge: string;
    badgeClass: string;
  }> = [
    {
      key: "overview",
      label: "Stock Overview",
      badge: formatNumber(depotRows.length),
      badgeClass:
        "rounded-full bg-primary-container px-1.5 py-0.5 font-mono-data-sm text-[10px] text-on-primary",
    },
    {
      key: "movements",
      label: "Stock Movements",
      badge: `Today: ${formatNumber(todayMovements)}`,
      badgeClass:
        "rounded border border-outline-variant bg-surface-container-highest px-1.5 py-0.5 font-mono-data-sm text-[10px] text-secondary",
    },
    {
      key: "adjustments",
      label: "Adjustments",
      badge: `${formatNumber(adjustmentMovements)} logged`,
      badgeClass:
        "rounded border border-[#F4E3C4] bg-[#FDF6E8] px-1.5 py-0.5 font-mono-data-sm text-[10px] text-[#B47818]",
    },
    {
      key: "transfers",
      label: "Transfers",
      // Transfers are not modelled yet; the tab shows its empty state until records exist.
      badge: "0 transit",
      badgeClass:
        "rounded bg-secondary-container px-1.5 py-0.5 font-mono-data-sm text-[10px] text-on-secondary-container",
    },
    {
      key: "alerts",
      label: "Alerts",
      badge: `${formatNumber(alertCount)} alerts`,
      badgeClass:
        "rounded border border-[#F7D1CD] bg-[#FDF0EE] px-1.5 py-0.5 font-mono-data-sm text-[10px] font-semibold text-[#BA3C34]",
    },
  ];

  function openAdjust(row?: StockRow) {
    if (row) setSelectedRow(row);
    setAdjustOpen(true);
    if (activeTab !== "overview") setActiveTab("overview");
  }

  function handleAdjustAction() {
    if (activeTab === "overview") {
      setAdjustOpen((open) => !open);
      return;
    }
    setActiveTab("overview");
    setAdjustOpen(true);
  }

  function handleDepotChange(value: string) {
    setDepotFilter(value);
    setSelectedRow(null);
  }

  function handleAdjusted(updatedProduct: Product, movement: StockMovementDto) {
    setProducts((current) =>
      current.map((product) =>
        product._id === updatedProduct._id ? updatedProduct : product
      )
    );
    setMovements((current) => [movement, ...current]);
    setSelectedRow((current) => refreshedStockRow(updatedProduct, current));
  }

  async function handleDeleteMovement(movementId: string) {
    const result = await deleteStockMovement(movementId);

    setProducts((current) =>
      current.map((product) =>
        product._id === result.product._id ? result.product : product
      )
    );
    setMovements((current) => current.filter((movement) => movement._id !== movementId));
    setSelectedRow((current) =>
      current?.productId === result.product._id
        ? refreshedStockRow(result.product, current)
        : current
    );
  }

  function exportCsv() {
    const header = [
      "SKU",
      "Product",
      "Flavor",
      "Brand",
      "Warehouse",
      "Location",
      "Available",
      "Reserved",
      "Unit",
      "Min Safety",
      "Status",
      "Purchase Price",
    ];
    const lines = exportRows.map((row) => [
      row.sku,
      row.name,
      formatFlavorLabel(row.flavor),
      row.brand,
      row.warehouse,
      row.location,
      row.available,
      row.reserved,
      row.unit,
      row.minSafety,
      row.status,
      row.purchasePrice,
    ]);
    const csv = [header, ...lines]
      .map((line) =>
        line
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeTab === "alerts" ? "stock-alerts" : "inventory"}-${
      depotFilter === "all"
        ? "all-depots"
        : depotFilter.replace(/[^a-z0-9]+/gi, "-").toLowerCase()
    }.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell activePath="inventory">
      <div className="flex flex-col gap-4 text-on-surface">
        {/* Page header & action bar */}
        <div className="flex flex-col justify-between gap-3 border-b border-outline-variant pb-2 md:flex-row md:items-center">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">Inventory</h1>
              <span className="inline-flex max-w-[260px] items-center truncate rounded border border-outline-variant bg-surface-container px-2 py-0.5 font-mono-data-sm text-mono-data-sm font-semibold uppercase text-primary">
                Depot: {depotLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-[#D1E8DC] bg-[#EBF5F0] px-2 py-0.5 font-label-caps text-label-caps uppercase text-[#2E7D58]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2E7D58]" />
                Live from MongoDB
              </span>
            </div>
            <p className="mt-0.5 font-body-default text-body-default text-secondary">
              Real-time stock ledger, physical audits, warehouse transfers &amp; low-threshold alerts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="flex h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">picture_as_pdf</span>
              <span>Stock Audit Report (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transfers")}
              className="flex h-[34px] items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">sync_alt</span>
              <span>Transfer Stock</span>
            </button>
            <button
              type="button"
              onClick={handleAdjustAction}
              disabled={!activeRow}
              className="flex h-[34px] items-center gap-1.5 rounded bg-primary-container px-3.5 font-body-medium text-body-medium text-on-primary shadow-sm transition-colors hover:bg-primary disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>+ Adjust Stock</span>
            </button>
          </div>
        </div>

        <InventoryKpis
          totalUnits={summary.totalUnits}
          reservedUnits={summary.reservedUnits}
          stockValue={summary.stockValue}
          lowCount={summary.lowCount}
          criticalCount={summary.criticalCount}
          skuCount={depotRows.length}
        />

        {/* Ledger sub-tabs & filter bar */}
        <div className="flex flex-col items-stretch justify-between gap-3 pt-1 lg:flex-row lg:items-center">
          <div
            role="tablist"
            aria-label="Inventory views"
            className="flex items-center overflow-x-auto rounded border border-outline-variant bg-surface-container p-0.5"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                id={`inventory-tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls="inventory-tabpanel"
                onClick={() => setActiveTab(tab.key)}
                className={activeTab === tab.key ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS}
              >
                <span>{tab.label}</span>
                <span className={tab.badgeClass}>{tab.badge}</span>
              </button>
            ))}
          </div>

          {activeTab === "overview" || activeTab === "alerts" ? (
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <div className="relative flex-1 sm:w-72">
                <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-2 text-[16px] text-outline">
                  search
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-8 w-full rounded border border-outline-variant bg-surface-container-lowest pl-8 pr-12 font-body-default text-body-default text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
                  placeholder={
                    activeTab === "alerts"
                      ? "Filter alerts by SKU, product, bay…"
                      : "Filter by SKU, product, bay…"
                  }
                  type="text"
                />
                <span className="pointer-events-none absolute right-2 top-1.5 rounded border border-outline-variant bg-surface-container-high px-1 py-0.5 font-mono-data-sm text-[10px] text-outline">
                  {exportRows.length}
                </span>
              </div>

              <div className="relative">
                <select
                  value={depotFilter}
                  onChange={(event) => handleDepotChange(event.target.value)}
                  className="h-8 cursor-pointer appearance-none rounded border border-outline-variant bg-surface-container-lowest pl-2.5 pr-7 font-body-medium text-body-medium text-on-surface focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
                >
                  <option value="all">All Depots</option>
                  {depots.map((depot) => (
                    <option key={depot} value={depot}>
                      {depot}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-1.5 top-2 text-[16px] text-secondary">
                  arrow_drop_down
                </span>
              </div>

              <button
                type="button"
                onClick={exportCsv}
                disabled={exportRows.length === 0}
                className="flex h-8 items-center gap-1 rounded border border-outline-variant bg-surface-container-lowest px-2.5 font-body-default text-body-default text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
                title={
                  activeTab === "alerts"
                    ? "Export active alerts as CSV"
                    : "Export current inventory sheet as CSV"
                }
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* Compliance audit notice */}
        <div className="flex w-full items-center justify-between rounded border border-outline-variant bg-surface-container-high px-3 py-2 text-secondary">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
            <span className="font-body-dense text-body-dense text-on-surface">
              <strong className="font-semibold text-primary">Strict Ledger Integrity:</strong> Direct in-cell
              quantity edits are disabled. All inventory adjustments require a documented audit trail via the{" "}
              <strong className="font-semibold">&quot;Adjust Stock&quot;</strong> protocol with mandatory reason
              classification, incident reference, and supporting notes.
            </span>
          </div>
          <div className="hidden items-center gap-2 font-mono-data-sm text-mono-data-sm text-secondary md:flex">
            <span>
              Products: <strong>{products.length}</strong>
            </span>
            <span>•</span>
            <span>
              Movements: <strong>{movements.length}</strong>
            </span>
          </div>
        </div>

        {error ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#F7D1CD] bg-[#FDF0EE] px-3 py-2 font-body-dense text-body-dense text-[#BA3C34]">
            <span>
              <strong>Could not load inventory:</strong> {error}
            </span>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className="rounded border border-[#F7D1CD] bg-surface-container-lowest px-2 py-1 font-body-medium text-body-medium text-[#BA3C34] hover:bg-[#FDF0EE]"
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded border border-outline-variant bg-surface-container-lowest px-4 py-14 text-center">
            <span className="material-symbols-outlined animate-spin text-[24px] text-primary">
              progress_activity
            </span>
            <p className="font-body-medium text-body-medium font-semibold text-on-surface">
              Loading inventory from MongoDB…
            </p>
            <p className="font-body-dense text-body-dense text-secondary">
              Fetching products and the latest stock movements.
            </p>
          </div>
        ) : rows.length === 0 && !error ? (
          <InventoryEmptyState
            icon="inventory_2"
            title="No products in inventory yet"
            description="Add a product with opening stock to start tracking it here."
            action={
              <a href="/products/add" className={EMPTY_ACTION_CLASS}>
                Add Product
              </a>
            }
          />
        ) : rows.length > 0 ? (
          <div
            id="inventory-tabpanel"
            role="tabpanel"
            aria-labelledby={`inventory-tab-${activeTab}`}
          >
            {activeTab === "overview" ? (
              <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
                <div
                  className={`${
                    adjustOpen && activeRow ? "xl:col-span-8" : "xl:col-span-12"
                  } flex flex-col space-y-4`}
                >
                  <StockTable rows={filteredRows} onAdjust={openAdjust} />
                  <MovementsLedger
                    key="overview-ledger"
                    entries={movementEntries}
                    onDelete={handleDeleteMovement}
                  />
                </div>

                {adjustOpen && activeRow ? (
                  <div className="xl:col-span-4">
                    <AdjustStockPanel
                      key={activeRow.id}
                      row={activeRow}
                      onClose={() => setAdjustOpen(false)}
                      onAdjusted={handleAdjusted}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "movements" ? (
              <MovementsLedger
                key="movements-ledger"
                entries={movementEntries}
                onDelete={handleDeleteMovement}
              />
            ) : null}

            {activeTab === "adjustments" ? (
              <MovementsLedger
                key="adjustments-ledger"
                entries={adjustmentEntries}
                onDelete={handleDeleteMovement}
                showFilters={false}
                title="Adjustment History"
                subtitle="All audited stock deductions and additions"
                emptyTitle="No stock adjustments recorded yet"
                emptyMessage="Use Adjust Stock to log the first audited deduction or addition."
              />
            ) : null}

            {activeTab === "transfers" ? (
              <InventoryEmptyState
                icon="sync_alt"
                title="No stock transfers recorded"
                description="Depot-to-depot transfers will be listed here once they are recorded. There are no transfer records in the inventory ledger yet."
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className={EMPTY_ACTION_CLASS}
                  >
                    Back to Stock Overview
                  </button>
                }
              />
            ) : null}

            {activeTab === "alerts" ? (
              depotAlertRows.length === 0 ? (
                <InventoryEmptyState
                  icon="check_circle"
                  title="No active stock alerts"
                  description={`All ${formatNumber(
                    depotRows.length
                  )} tracked SKUs in ${depotPhrase} are above their safety thresholds.`}
                  action={
                    <button
                      type="button"
                      onClick={() => setActiveTab("overview")}
                      className={EMPTY_ACTION_CLASS}
                    >
                      View Stock Overview
                    </button>
                  }
                />
              ) : alertRows.length === 0 ? (
                <InventoryEmptyState
                  icon="search_off"
                  title="No alerts match your search"
                  description="Clear the search or choose another depot to see active low and critical stock alerts."
                  action={
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className={EMPTY_ACTION_CLASS}
                    >
                      Clear Search
                    </button>
                  }
                />
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#F7D1CD] bg-[#FDF0EE] px-3 py-2">
                    <div className="flex items-center gap-2 font-body-dense text-body-dense text-[#BA3C34]">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      <span>
                        <strong>{summary.criticalCount} critical</strong> and{" "}
                        <strong>{summary.lowCount} low-stock</strong> SKUs across{" "}
                        {depotPhrase} require replenishment.
                      </span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-[#BA3C34]">
                      {formatNumber(alertRows.length)} shown
                    </span>
                  </div>
                  <StockTable rows={alertRows} onAdjust={openAdjust} scope="alerts" />
                </div>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
