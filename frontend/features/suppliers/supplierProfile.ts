import type { PurchaseDto } from "../purchases/types";
import { PAYMENT_TERM_OPTIONS } from "./constants";
import type {
  MasterProfileRow,
  Purchase,
  PurchaseStatus,
  SupplierFinancials,
  SupplierInvoiceRow,
  SupplierPaymentRow,
  SupplierProfile,
  TimelineEntry,
} from "./supplierDetailData";
import type { Supplier } from "./types";
import { formatRs } from "./utils";

const PURCHASE_STATUSES: PurchaseStatus[] = [
  "Draft",
  "Ordered",
  "Partially Received",
  "Received",
  "Cancelled",
];

function toStatus(value: string): PurchaseStatus {
  return PURCHASE_STATUSES.includes(value as PurchaseStatus)
    ? (value as PurchaseStatus)
    : "Ordered";
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function toPurchase(purchase: PurchaseDto): Purchase {
  const orderedQuantity = purchase.items.reduce(
    (sum, item) => sum + Math.max(Number(item.quantity) || 0, 0),
    0
  );
  const receivedQuantity = purchase.items.reduce(
    (sum, item) => sum + Math.max(Number(item.receivedQuantity) || 0, 0),
    0
  );
  const receipts = purchase.items.flatMap((item) => item.receipts || []);
  const latestReceipt = [...receipts].sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  )[0];
  const paid = Math.max(Number(purchase.paidAmount) || 0, 0);
  const total = Math.max(Number(purchase.financials?.total) || 0, 0);
  const status = toStatus(purchase.status);
  const lines = purchase.items.map((item) => {
    const quantity = Math.max(Number(item.quantity) || 0, 0);
    const unitPrice = Math.max(Number(item.unitPrice) || 0, 0);
    return {
      name: item.name,
      sku: item.sku || "",
quantity,
      receivedQuantity: Math.max(Number(item.receivedQuantity) || 0, 0),
      basePrice: Number(item.basePrice) || unitPrice,
unitPrice,
      lineTotal: Number(item.lineTotal) || quantity * unitPrice,
      unit: item.unit || "units",
      date: formatDate(purchase.purchaseDate),
      status,
      purchaseId: purchase.purchaseNumber,
    };
  });

  return {
    id: purchase.purchaseNumber,
    date: formatDate(purchase.purchaseDate),
    items:
      purchase.items.map((item) => item.name).join(" & ") || "No items recorded",
    lines,
    reference: purchase.invoiceNumber
      ? `Invoice #${purchase.invoiceNumber}`
      : purchase.notes || "No invoice reference",
    total,
    paid,
    remaining: Math.max(total - paid, 0),
    status,
    orderedQuantity,
    receivedQuantity,
    delivery:
      receivedQuantity > 0
        ? {
            gateInward: purchase.invoiceNumber
              ? `Invoice #${purchase.invoiceNumber}`
              : "Receipt recorded",
            receivedQuantity,
            orderedQuantity,
            audit:
              purchase.items
                .map((item) => {
                  const itemReceived = Math.max(Number(item.receivedQuantity) || 0, 0);
                  const itemOrdered = Math.max(Number(item.quantity) || 0, 0);
                  return `${item.name}: ${itemReceived}/${itemOrdered} ${item.unit || "units"}`;
                })
                .join(" · ") || "No item detail",
            inspector: latestReceipt?.performedBy || purchase.createdBy || "—",
            grnSigned: `${receipts.length} receipt record${receipts.length === 1 ? "" : "s"}`,
          }
        : undefined,
  };
}

function toPaymentRows(purchases: PurchaseDto[]): SupplierPaymentRow[] {
  const rows = purchases.flatMap((purchase) =>
    (purchase.payments || []).map((payment, index) => ({
      id: `${purchase.purchaseNumber}-${payment.paidAt}-${index}`,
      title: `${formatRs(payment.amount)} paid via ${payment.method || "Cash"}`,
      detail: `${purchase.purchaseNumber}${payment.reference ? ` · ${payment.reference}` : ""}`,
      date: formatDate(payment.paidAt),
      amount: Math.max(Number(payment.amount) || 0, 0),
      method: payment.method || "Cash",
      reference: payment.reference || "",
      sortDate: payment.paidAt,
    }))
  );

  return rows
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
    .map((row) => ({
      id: row.id,
      title: row.title,
      detail: row.detail,
      date: row.date,
      amount: row.amount,
      method: row.method,
      reference: row.reference,
    }));
}

function toTimeline(purchases: PurchaseDto[], payments: SupplierPaymentRow[]): TimelineEntry[] {
  const entries: Array<TimelineEntry & { sortDate: string }> = [];

  for (const purchase of purchases) {
    const ordered = purchase.items.reduce(
      (sum, item) => sum + Math.max(Number(item.quantity) || 0, 0),
      0
    );
    const received = purchase.items.reduce(
      (sum, item) => sum + Math.max(Number(item.receivedQuantity) || 0, 0),
      0
    );

    entries.push({
      id: `${purchase.purchaseNumber}-placed`,
      title: `${purchase.purchaseNumber} placed for ${formatRs(purchase.financials?.total || 0)}`,
      date: formatShortDate(purchase.purchaseDate),
      detail: `${ordered} unit${ordered === 1 ? "" : "s"} ordered`,
      tone: "secondary",
      sortDate: purchase.purchaseDate,
    });

    if (received > 0) {
      entries.push({
        id: `${purchase.purchaseNumber}-received`,
        title: `${purchase.purchaseNumber} received ${received}/${ordered}`,
        date: formatShortDate(purchase.updatedAt || purchase.purchaseDate),
        detail: "Receipt recorded in the purchase ledger",
        tone: "amber",
        sortDate: purchase.updatedAt || purchase.purchaseDate,
      });
    }
  }

  for (const payment of payments) {
    entries.push({
      id: `${payment.id}-timeline`,
      title: payment.title,
      date: formatShortDate(payment.date === "—" ? undefined : payment.date),
      detail: payment.detail,
      tone: "primary",
      sortDate: payment.date,
    });
  }

  return entries
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      date: entry.date,
      detail: entry.detail,
      tone: entry.tone,
    }));
}

function toMasterProfile(supplier: Supplier): MasterProfileRow[] {
  const rows: MasterProfileRow[] = [
    { label: "Vendor Code", value: supplier.code },
  ];

  if (supplier.ntn) {
    rows.push({ label: "NTN / STRN", value: supplier.ntn });
  }

  rows.push(
    {
      label: "Payment Terms",
      value:
        PAYMENT_TERM_OPTIONS.find((option) => option.value === supplier.paymentTerms)?.label ||
        supplier.paymentTerms,
    },
    { label: "Credit Grace", value: `${supplier.graceDays} day${supplier.graceDays === 1 ? "" : "s"} buffer` },
    {
      label: "Primary Contact",
      value: supplier.contact || "—",
      stacked: true,
    },
    {
      label: "Phone / Email",
      value: supplier.phone || "—",
      sub: supplier.email || "No email on file",
      stacked: true,
    },
    {
      label: "Dispatch Hub",
      value: supplier.address || supplier.hub || "—",
      stacked: true,
    },
    {
      label: "Catalog Products",
      value: `${supplier.productIds.length} linked product${supplier.productIds.length === 1 ? "" : "s"}`,
    }
  );

  if (supplier.notes) {
    rows.push({ label: "Procurement Notes", value: supplier.notes, stacked: true });
  }

  return rows;
}

function toFinancials(
  supplier: Supplier,
  purchases: PurchaseDto[],
  payments: SupplierPaymentRow[]
): SupplierFinancials {
  const activePurchases = purchases.filter((purchase) => purchase.status !== "Cancelled");
  const totalPurchased = activePurchases.reduce(
    (sum, purchase) => sum + Math.max(Number(purchase.financials?.total) || 0, 0),
    0
  );
  const amountPaid = activePurchases.reduce(
    (sum, purchase) => sum + Math.max(Number(purchase.paidAmount) || 0, 0),
    0
  );
  const remainingPayable = activePurchases.reduce((sum, purchase) => {
    const total = Math.max(Number(purchase.financials?.total) || 0, 0);
    const paid = Math.max(Number(purchase.paidAmount) || 0, 0);
    return sum + Math.max(total - paid, 0);
  }, 0);
  const termsLabel =
    PAYMENT_TERM_OPTIONS.find((option) => option.value === supplier.paymentTerms)?.label ||
    supplier.paymentTerms;
  const lastPayment = payments[0];

  return {
    totalPurchased,
    purchaseOrders: activePurchases.length,
    amountPaid,
    termsLabel,
    remainingPayable,
    dueDate: "On terms",
    overdueNote:
      remainingPayable > 0
        ? `${termsLabel} · ${supplier.graceDays} day grace`
        : "No outstanding balance",
    lastPaymentDate: lastPayment ? lastPayment.date : "—",
    lastPaymentAmount: lastPayment?.amount || 0,
    lastPaymentVoucher: lastPayment?.reference || "—",
  };
}

export function buildSupplierProfile(
  supplier: Supplier,
  purchases: PurchaseDto[]
): SupplierProfile {
  const purchaseRows = purchases.map(toPurchase);
  const payments = toPaymentRows(purchases);

  return {
    header: {
      name: supplier.name,
      status: supplier.status,
      vendorCode: supplier.code,
      contact: supplier.contact,
      contactRole: "Supplier Contact",
      phone: supplier.phone,
      email: supplier.email,
      location: supplier.address || supplier.hub || "—",
    },
    financials: toFinancials(supplier, purchases, payments),
    purchases: purchaseRows,
    payments,
    invoices: purchaseRows.map(
      (purchase): SupplierInvoiceRow => ({
        id: purchase.id,
        date: purchase.date,
        reference: purchase.reference,
        total: purchase.total,
        status: purchase.status,
      })
    ),
    masterProfile: toMasterProfile(supplier),
    timeline: toTimeline(purchases, payments),
  };
}
