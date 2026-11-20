import type {
  DateFilter,
  DraftOrderInput,
  DraftOrderItemInput,
  HubFilter,
  OrderStatus,
  PaymentFilter,
  PaymentStatus,
  SalesOrder,
  StatusFilter,
  StatusTab,
} from "./types";

export type SalesKpisData = {
  totalSalesToday: number;
  todayOrders: number;
  awaitingPacking: number;
  pendingAction: number;
  pendingCollection: number;
  completed: number;
  dispatched: number;
  creditHold: number;
};

const STATUS_TABS: StatusTab[] = [
  "All Orders",
  "Pending Approval",
  "Processing",
  "Dispatched",
  "Credit Hold",
];

export function createEmptyDraftOrder(): DraftOrderInput {
  return {
    customer: "",
    phone: "",
    location: "",
    hub: "Lahore Central Depot",
    bay: "Counter",
    paymentStatus: "unpaid",
    paymentMethod: "Cash",
    status: "Pending Approval",
    amountReceived: 0,
    discount: 0,
    freight: 0,
    items: [{ name: "", sku: "", flavor: "", quantity: 1, unitLabel: "pcs", unitPrice: 0 }],
  };
}

export function draftOrderFromSalesOrder(order: SalesOrder): DraftOrderInput {
  const items: DraftOrderItemInput[] = order.items.map((item) => ({
    name: item.name,
    sku: item.sku,
    flavor: item.flavor || "",
    quantity: item.quantity,
    unitLabel: item.unitLabel,
    unitPrice: item.unitPrice,
  }));

  return {
    customer: order.customer,
    phone: order.phone,
    location: order.location,
    hub: order.hub,
    bay: order.bay,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod || "Cash",
    status: order.status,
    amountReceived: order.financials.paid,
    discount: order.financials.discount,
    freight: order.financials.freight,
    items,
  };
}

export function getSalesKpis(orders: SalesOrder[]): SalesKpisData {
  const todayOrders = orders.filter((order) => order.dateGroup === "today");
  const awaitingPacking = orders.filter(
    (order) => order.status === "Processing" || order.status === "Packed"
  ).length;
  const pendingAction = orders.filter((order) =>
    ["Pending Approval", "Processing", "Packed", "Credit Hold"].includes(order.status)
  ).length;
  const pendingCollection = orders.reduce(
    (sum, order) => sum + Math.max(order.financials.outstanding, 0),
    0
  );
  const dispatched = orders.filter((order) => order.status === "Dispatched").length;

  return {
    totalSalesToday: todayOrders.reduce((sum, order) => sum + order.financials.total, 0),
    todayOrders: todayOrders.length,
    awaitingPacking,
    pendingAction,
    pendingCollection,
    completed: dispatched,
    dispatched,
    creditHold: orders.filter((order) => order.status === "Credit Hold").length,
  };
}

export function getStatusCounts(orders: SalesOrder[]): Record<StatusTab, number> {
  const counts = STATUS_TABS.reduce((result, status) => {
    result[status] = status === "All Orders" ? orders.length : 0;
    return result;
  }, {} as Record<StatusTab, number>);

  orders.forEach((order) => {
    if (order.status in counts) {
      counts[order.status as StatusTab] += 1;
    }
  });

  return counts;
}

export function formatRs(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}Rs. ${Math.abs(value).toLocaleString("en-PK")}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-PK");
}

export function formatCompactAmount(value: number): string {
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`;
  }
  return String(value);
}

export function getPaymentClasses(status: PaymentStatus): string {
  if (status === "paid") {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (status === "partial") {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  return "bg-stone-100 text-stone-700 border-stone-300";
}

export function getStatusClasses(status: OrderStatus): string {
  switch (status) {
    case "Processing":
      return "bg-surface-container-highest text-primary border-outline-variant font-medium";
    case "Packed":
    case "Pending Approval":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "Delivered":
      return "bg-emerald-50 text-emerald-900 border-emerald-200";
    case "Dispatched":
      return "bg-surface-container text-on-surface-variant border-outline-variant";
    case "Credit Hold":
      return "bg-error-container/40 text-error border-error-container";
  }
}

type OrderFilters = {
  query: string;
  status: StatusFilter;
  payment: PaymentFilter;
  date: DateFilter;
  hub: HubFilter;
};

export function filterOrders(orders: SalesOrder[], filters: OrderFilters): SalesOrder[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return orders.filter((order) => {
    if (filters.status !== "All Orders" && order.status !== filters.status) {
      return false;
    }
    if (filters.payment !== "all" && order.paymentStatus !== filters.payment) {
      return false;
    }
    if (filters.date !== "all" && order.dateGroup !== filters.date) {
      return false;
    }
    if (filters.hub !== "all" && order.hub !== filters.hub) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }

    return [order.id, order.customer, order.phone, order.location]
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

function escapeCsv(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function ordersToCsv(orders: SalesOrder[]): string {
  const header = [
    "Order #",
    "Time",
    "Customer",
    "Location",
    "Items",
    "Amount (Rs.)",
    "Payment",
    "Status",
  ];

  const rows = orders.map((order) => [
    order.id,
    order.time,
    order.customer,
    order.location,
    `${order.skuCount} SKUs (${order.unitCount}u)`,
    order.amount,
    order.paymentLabel,
    order.status,
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
