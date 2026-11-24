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
import { formatNumber, movementToEntry, toStockRows } from "./utils";
import { parseMoneyInput } from "../lib/units";

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

function refreshedStockRow(product: Product, _previous: StockRow | null) {
  return toStockRows(product)[0] ?? null;
}

const ACTIVE_TAB_CLASS =
  "flex flex-1 min-w-fit items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary-container bg-primary-fixed/20 px-3.5 py-2 font-body-medium text-body-medium text-primary shadow-panel transition duration-200";
const INACTIVE_TAB_CLASS =
  "flex flex-1 min-w-fit items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 font-body-default text-body-default text-on-surface-variant transition duration-200 hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container";
const EMPTY_ACTION_CLASS =
  "inline-flex h-9 items-center justify-center rounded-lg bg-primary-container px-4 font-body-medium text-body-medium font-semibold text-on-primary shadow-panel transition duration-200 hover:bg-primary active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [activeTab, setActiveTab] = useState<InventoryTab>("overview");
  const [adjustOpen, setAdjustOpen] = useState(false);
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
        acc.stockValue += row.available * (parseMoneyInput(row.purchasePrice) ?? 0);
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
        "rounded-md bg-primary-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-primary",
    },
    {
      key: "movements",
      label: "Stock Movements",
      badge: `Today: ${formatNumber(todayMovements)}`,
      badgeClass:
        "rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant",
    },
    {
      key: "adjustments",
      label: "Adjustments",
      badge: `${formatNumber(adjustmentMovements)} logged`,
      badgeClass:
        "rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant",
    },
    {
      key: "transfers",
      label: "Transfers",
      badge: "0 transit",
      badgeClass:
        "rounded-md bg-secondary-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-secondary-container",
    },
    {
      key: "alerts",
      label: "Alerts",
      badge: `${formatNumber(alertCount)} alerts`,
      badgeClass:
        "rounded-md border border-error/20 bg-error-container/30 px-2 py-1 font-mono-data-sm text-mono-data-sm font-semibold text-error",
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
      "Brand",
      "Warehouse",
      "Location",
      "Available",
      "Reserved",
      "Unit",
      "Min Safety",
      "Status",
      "Purchase Price / Piece",
    ];
    const lines = exportRows.map((row) => [
      row.sku,
      row.name,
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
      <div className="flex flex-col gap-5 text-on-surface">
        <div className="flex flex-col justify-between gap-4 border-b border-outline-variant pb-4 md:flex-row md:items-end">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">Inventory</h1>
              <span className="inline-flex max-w-[260px] items-center truncate rounded-md border border-outline-variant bg-surface-container px-2.5 py-1 font-mono-data-sm text-mono-data-sm font-semibold uppercase text-on-surface-variant">
                Depot: {depotLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary-fixed/20 px-2.5 py-1 font-label-caps text-label-caps uppercase text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Live from MongoDB
              </span>
            </div>
            <p className="mt-1 font-body-default text-body-default text-on-surface-variant">
              Real-time stock ledger, physical audits, warehouse transfers &amp; low-threshold alerts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            >
              <span className="material-symbols-outlined text-[17px] text-on-surface-variant">picture_as_pdf</span>
              <span>Stock Audit Report (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transfers")}
              className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            >
              <span className="material-symbols-outlined text-[17px] text-on-surface-variant">sync_alt</span>
              <span>Transfer Stock</span>
            </button>
            <button
              type="button"
              onClick={handleAdjustAction}
              disabled={!activeRow}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary-container px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary active:translate-y-px active:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
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

        <div className="flex flex-col items-stretch gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <div className="relative flex-1 sm:w-72">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-2.5 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-9 pr-14 font-body-default text-body-default text-on-surface placeholder:text-outline transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder={
                  activeTab === "alerts"
                    ? "Filter alerts by SKU, product, bay..."
                    : "Filter by SKU, product, bay..."
                }
                type="text"
              />
              <span className="pointer-events-none absolute right-2 top-2 rounded-md border border-outline-variant bg-surface-container-high px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                {exportRows.length}
              </span>
            </div>

            <div className="relative">
              <select
                value={depotFilter}
                onChange={(event) => handleDepotChange(event.target.value)}
                className="h-9 cursor-pointer appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest pl-3 pr-8 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                <option value="all">All Depots</option>
                {depots.map((depot) => (
                  <option key={depot} value={depot}>
                    {depot}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-[18px] text-on-surface-variant">
                arrow_drop_down
              </span>
            </div>

            <button
              type="button"
              onClick={exportCsv}
              disabled={exportRows.length === 0}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface-variant transition duration-200 hover:border-outline hover:bg-surface-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:opacity-50"
              title={
                activeTab === "alerts"
                  ? "Export active alerts as CSV"
                  : "Export current inventory sheet as CSV"
              }
            >
              <span className="material-symbols-outlined text-[17px]">file_download</span>
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

          <div
            role="tablist"
            aria-label="Inventory views"
            className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-outline-variant/80 bg-surface-container p-1.5 shadow-panel"
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
        </div>

        <div className="flex w-full items-center justify-between gap-4 rounded-xl border border-outline-variant/80 bg-surface-container-high px-4 py-3 text-on-surface-variant shadow-panel">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
            <span className="font-body-default text-body-default text-on-surface-variant">
              <strong className="font-semibold text-primary">Strict Ledger Integrity:</strong> Direct in-cell
              quantity edits are disabled. All inventory adjustments require a documented audit trail via the{" "}
              <strong className="font-semibold">&quot;Adjust Stock&quot;</strong> protocol with mandatory reason
              classification, incident reference, and supporting notes.
            </span>
          </div>
          <div className="hidden items-center gap-2 font-mono-data-sm text-mono-data-sm text-on-surface-variant md:flex">
            <span>
              Products: <strong>{products.length}</strong>
            </span>
            <span>|</span>
            <span>
              Movements: <strong>{movements.length}</strong>
            </span>
          </div>
        </div>

        {error ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 font-body-default text-body-default text-error shadow-panel">
            <span>
              <strong>Could not load inventory:</strong> {error}
            </span>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className="rounded-lg border border-error/30 bg-surface-container-lowest px-3 py-1.5 font-body-medium text-body-medium text-error transition duration-200 hover:bg-error-container/40 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-4 py-16 text-center shadow-panel">
            <span className="material-symbols-outlined animate-spin text-[26px] text-primary">
              progress_activity
            </span>
            <p className="font-body-medium text-body-medium font-semibold text-on-surface">
              Loading inventory from MongoDB...
            </p>
            <p className="font-body-default text-body-default text-on-surface-variant">
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
              <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
                <div
                  className={`${
                    adjustOpen && activeRow ? "xl:col-span-8" : "xl:col-span-12"
                  } flex flex-col space-y-5`}
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
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 shadow-panel">
                    <div className="flex items-center gap-2 font-body-default text-body-default text-error">
                      <span className="material-symbols-outlined text-[19px]">warning</span>
                      <span>
                        <strong>{summary.criticalCount} critical</strong> and{" "}
                        <strong>{summary.lowCount} low-stock</strong> SKUs across{" "}
                        {depotPhrase} require replenishment.
                      </span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-error">
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
