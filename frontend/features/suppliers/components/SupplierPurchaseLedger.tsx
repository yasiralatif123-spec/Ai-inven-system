"use client";

import { useMemo, useState } from "react";
import type { Purchase, PurchaseStatus } from "../supplierDetailData";
import { priceBasisLabel } from "../../../app/lib/units";
import { formatRs } from "../utils";

type StatusFilter = "all" | PurchaseStatus;

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "Received", label: "Received" },
  { value: "Partially Received", label: "Partially Received" },
  { value: "Ordered", label: "Ordered" },
  { value: "Draft", label: "Draft" },
  { value: "Cancelled", label: "Cancelled" },
];

const STATUS_CLASSES: Record<PurchaseStatus, string> = {
  Received: "border border-success-border bg-success-container text-success",
  "Partially Received": "border border-warning-border bg-warning-container text-warning",
  Ordered: "border border-outline-variant bg-secondary-container text-on-secondary-container",
  Draft: "border border-outline-variant bg-surface-container text-secondary",
  Cancelled: "border border-error/20 bg-error-container px-2 text-on-error-container",
};

function exportPurchases(rows: Purchase[]) {
  const header = [
    "Purchase ID",
    "Date",
    "Purchased Products",    "Ordered Quantity",
    "Received Quantity",
    "Total Amount",
    "Paid",
    "Remaining",
    "Status",
  ];
  const body = rows.map((row) => [
    row.id,
    row.date,
    [
      row.items,
      row.reference,
      ...row.lines.map(
        (line) =>
          `${line.name}${line.sku ? ` (${line.sku})` : ""} · qty ${line.quantity} ${priceBasisLabel(line.unit)} · unit price ${line.unitPrice} / ${priceBasisLabel(line.unit)} · total ${line.lineTotal} · received ${line.receivedQuantity}/${line.quantity} · ${line.date} · ${line.status}`
      ),
    ].join(" | "),
        String(row.orderedQuantity),
    String(row.receivedQuantity),
    String(row.total),
    String(row.paid),
    String(row.remaining),
    row.status,
  ]);
  const csv = [header, ...body]
    .map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "supplier-purchase-history.csv";
  link.click();
  URL.revokeObjectURL(url);
}

type SupplierPurchaseLedgerProps = {
  purchases: Purchase[];
  totalCount: number;
};

export function SupplierPurchaseLedger({ purchases, totalCount }: SupplierPurchaseLedgerProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();

    return purchases.filter((purchase) => {
      if (filter !== "all" && purchase.status !== filter) return false;
      if (!term) return true;

      return [
        purchase.id,
        purchase.items,
        purchase.reference,
        purchase.date,
        ...purchase.lines.flatMap((line) => [line.name, line.sku]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [filter, purchases, query]);

  const totalValue = rows.reduce((sum, purchase) => sum + purchase.total, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded border border-outline-variant bg-surface-container-lowest p-2.5">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-64 max-w-full">
            <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-2 text-[16px] text-outline">
              search
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PO #, item, or invoice…"
              className="h-[32px] w-full rounded border border-outline-variant bg-surface pl-8 pr-3 font-body-dense text-body-dense text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1 rounded border border-outline-variant bg-surface-container p-0.5">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 font-body-dense ${
                  filter === option.value
                    ? "border border-outline-variant/60 bg-surface-container-lowest font-body-medium text-on-surface shadow-sm"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                {option.label}
                {option.value === "Partially Received" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-warning-container0" />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => exportPurchases(rows)}
          className="flex h-[32px] items-center gap-1.5 rounded border border-outline-variant bg-surface px-2.5 font-body-medium text-body-dense text-on-surface transition-colors hover:bg-row-hover"
        >
          <span className="material-symbols-outlined text-[16px] text-secondary">file_download</span>
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="h-8 border-b border-outline-variant bg-surface-container-low text-[11px] font-semibold uppercase tracking-wider text-secondary">
                <th className="w-28 px-3">Purchase ID</th>
                <th className="w-24 px-3">Date</th>
                <th className="px-3">Purchased Products</th>
                <th className="w-24 px-3 text-right">Ordered</th>
                <th className="w-24 px-3 text-right">Received</th>
                <th className="w-28 px-3 text-right">Total Amount</th>
                <th className="w-24 px-3 text-right">Paid</th>
                <th className="w-28 px-3 text-right">Remaining</th>
                <th className="w-36 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-body-default text-body-dense text-on-surface">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center">
                    <div className="font-body-medium text-body-medium text-on-surface">
                      No purchases match this filter
                    </div>
                    <div className="mt-1 font-body-dense text-body-dense text-secondary">
                      Try a different status or search term.
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((purchase) => <PurchaseRow key={purchase.id} purchase={purchase} />)
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant bg-surface-container-low px-3.5 py-2.5 font-body-dense text-body-dense text-secondary">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>
              Showing <strong className="font-medium text-on-surface">{rows.length}</strong> of{" "}
              <strong className="font-medium text-on-surface">{totalCount}</strong> purchases
            </span>
            <span className="text-outline-variant">·</span>
            <span className="font-mono-data-sm text-mono-data-sm">
              Total PO Value: {formatRs(totalValue)}
            </span>
          </div>
          <span className="font-mono-data-sm text-mono-data-sm">
            Full supplier purchase ledger
          </span>
        </div>
      </div>
    </div>
  );
}

function PurchaseRow({ purchase }: { purchase: Purchase }) {
  const hasReference = Boolean(
    purchase.reference && purchase.reference !== "No invoice reference"
  );
  const showLineReceipt = purchase.status === "Partially Received";

  return (
    <tr
      className={`bg-surface-container-lowest transition-colors hover:bg-row-hover ${
        purchase.status === "Partially Received" ? "border-l-2 border-l-amber-600" : ""
      }`}
    >
      <td className="px-3 py-2 font-mono-data font-semibold text-primary">{purchase.id}</td>
      <td className="px-3 py-2 font-mono-data-sm text-mono-data-sm text-secondary">
        {purchase.date}
      </td>
      <td className="px-3 py-2">
        {hasReference ? (
          <div className="font-mono-data-sm text-mono-data-sm text-secondary">
            {purchase.reference}
          </div>
        ) : null}
        <div className={`flex flex-col gap-1 ${hasReference ? "mt-1" : ""}`}>
          {purchase.lines.map((line, index) => (
            <div
              key={`${line.purchaseId}-${line.sku || line.name}-${index}`}
              className="rounded border border-outline-variant/70 bg-surface-container-low px-2 py-1"
            >
              <div className="font-body-dense text-body-dense font-medium text-on-surface">
                {line.name}
                {line.sku ? (
                  <span className="ml-1 font-mono-data-sm text-mono-data-sm text-secondary">
                    · {line.sku}
                  </span>
                ) : null}
              </div>
              <div className="font-mono-data-sm text-mono-data-sm text-secondary">
                {line.quantity} {priceBasisLabel(line.unit)} @ {formatRs(line.unitPrice)} / {priceBasisLabel(line.unit)} = {formatRs(line.lineTotal)}
              </div>
              {showLineReceipt ? (
                <div className="font-mono-data-sm text-mono-data-sm text-outline">
                  received {line.receivedQuantity}/{line.quantity} {line.unit}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </td>

      <td className="px-3 py-2 text-right font-mono-data text-mono-data text-secondary">
        {purchase.orderedQuantity}
      </td>
      <td className="px-3 py-2 text-right font-mono-data text-mono-data text-secondary">
        {purchase.receivedQuantity}
      </td>
      <td className="px-3 py-2 text-right font-mono-data font-medium">
        {formatRs(purchase.total)}
      </td>
      <td
        className={`px-3 py-2 text-right font-mono-data ${
          purchase.paid > 0 ? "text-success" : "text-secondary"
        }`}
      >
        {formatRs(purchase.paid)}
      </td>
      <td
        className={`px-3 py-2 text-right font-mono-data ${
          purchase.remaining > 0 ? "font-semibold text-error" : "text-secondary"
        }`}
      >
        {formatRs(purchase.remaining)}
      </td>
      <td className="px-3 py-2 text-center">
        <span
          className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_CLASSES[purchase.status]}`}
        >
          {purchase.status}
        </span>
      </td>
    </tr>
  );
}
