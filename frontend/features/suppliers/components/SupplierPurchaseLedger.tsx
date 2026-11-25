"use client";

import { useMemo, useState } from "react";
import type { Purchase, PurchaseStatus } from "../supplierDetailData";
import { priceBasisLabel } from "../../../app/lib/units";
import { formatRs } from "../utils";
import {
  PROFILE_BUTTON_SECONDARY,
  PROFILE_CARD,
  PROFILE_ID_TOKEN,
  PROFILE_NUMERIC,
  PROFILE_SUBHEADER,
  PROFILE_TABLE_HEAD,
  PROFILE_TABLE_ROW,
  ProfileBadge,
  ProfileEmptyState,
} from "../../profiles/profile-ui";

type StatusFilter = "all" | PurchaseStatus;

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "Received", label: "Received" },
  { value: "Partially Received", label: "Partially Received" },
  { value: "Ordered", label: "Ordered" },
  { value: "Draft", label: "Draft" },
  { value: "Cancelled", label: "Cancelled" },
];

const STATUS_TONES: Record<PurchaseStatus, "success" | "warning" | "secondary" | "neutral" | "error"> = {
  Received: "success",
  "Partially Received": "warning",
  Ordered: "secondary",
  Draft: "neutral",
  Cancelled: "error",
};

function exportPurchases(rows: Purchase[]) {
  const header = [
    "Purchase ID",
    "Date",
    "Purchased Products",
    "Ordered Quantity",
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
      <div className={PROFILE_CARD}>
        <div className={`${PROFILE_SUBHEADER} flex-wrap`}>
          <div className="relative w-64 max-w-full">
            <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-2 text-[16px] text-outline">
              search
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PO #, item, or invoice…"
              className="h-[32px] w-full rounded-lg border border-outline-variant bg-surface pl-8 pr-3 font-body-dense text-body-dense text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`flex items-center gap-1 rounded-lg border border-outline-variant px-2 py-1 font-body-dense transition-colors ${
                  filter === option.value
                    ? "bg-primary-container/60 font-body-medium text-primary"
                    : "bg-surface text-on-surface-variant hover:bg-row-hover"
                }`}
              >
                {option.label}
                {option.value === "Partially Received" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                ) : null}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => exportPurchases(rows)}
            className={PROFILE_BUTTON_SECONDARY}
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">file_download</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className={`${PROFILE_CARD} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead>
              <tr className={PROFILE_TABLE_HEAD}>
                <th className="w-28 px-3 py-2">Purchase ID</th>
                <th className="w-24 px-3 py-2">Date</th>
                <th className="px-3 py-2">Purchased Products</th>
                <th className="w-24 px-3 py-2 text-right">Ordered</th>
                <th className="w-24 px-3 py-2 text-right">Received</th>
                <th className="w-28 px-3 py-2 text-right">Total Amount</th>
                <th className="w-24 px-3 py-2 text-right">Paid</th>
                <th className="w-28 px-3 py-2 text-right">Remaining</th>
                <th className="w-36 px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-body-default text-body-dense text-on-surface">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <ProfileEmptyState
                      compact
                      icon="receipt_long"
                      title="No purchases match this filter"
                      description="Try a different status or search term."
                    />
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
      className={`${PROFILE_TABLE_ROW} ${
        purchase.status === "Partially Received" ? "border-l-2 border-l-warning" : ""
      }`}
    >
      <td className="px-3 py-2">
        <span className={PROFILE_ID_TOKEN}>{purchase.id}</span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-mono-data-sm text-mono-data-sm text-secondary">
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

      <td className={`${PROFILE_NUMERIC} whitespace-nowrap px-3 py-2 text-right text-secondary`}>
        {purchase.orderedQuantity}
      </td>
      <td className={`${PROFILE_NUMERIC} whitespace-nowrap px-3 py-2 text-right text-secondary`}>
        {purchase.receivedQuantity}
      </td>
      <td className={`${PROFILE_NUMERIC} whitespace-nowrap px-3 py-2 text-right font-medium`}>
        {formatRs(purchase.total)}
      </td>
      <td className={`${PROFILE_NUMERIC} whitespace-nowrap px-3 py-2 text-right ${
        purchase.paid > 0 ? "text-success" : "text-secondary"
      }`}>
        {formatRs(purchase.paid)}
      </td>
      <td className={`${PROFILE_NUMERIC} whitespace-nowrap px-3 py-2 text-right ${
        purchase.remaining > 0 ? "font-semibold text-error" : "text-secondary"
      }`}>
        {formatRs(purchase.remaining)}
      </td>
      <td className="px-3 py-2 text-center">
        <ProfileBadge tone={STATUS_TONES[purchase.status]}>{purchase.status}</ProfileBadge>
      </td>
    </tr>
  );
}
