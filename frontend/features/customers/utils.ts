import type { SalesOrder } from "../sales-orders/types";
import type {
  Customer,
  CustomerFilters,
  CustomerSort,
  CustomerStatus,
  CustomerSummary,
} from "./types";

export function formatRs(value: number): string {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}

export function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString("en-PK");
}

export function isValidCustomerPhone(value: string): boolean {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("92")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.length === 10;
}

export function isOverLimit(customer: Customer): boolean {
  return customer.outstanding > customer.creditLimit;
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function customerMatchesOrder(customer: Customer, order: SalesOrder): boolean {
  if (order.customerId && customer.id) {
    return order.customerId === customer.id;
  }

  const orderPhone = phoneDigits(order.phone || "");
  const customerPhone = phoneDigits(customer.phone || "");
  if (orderPhone && customerPhone && orderPhone === customerPhone) return true;

  const orderName = (order.customer || "").trim().toLowerCase();
  if (!orderName) return false;

  return [customer.name, customer.business]
    .filter(Boolean)
    .some((value) => value.trim().toLowerCase() === orderName);
}

export function findCustomerForOrder(
  customers: Customer[],
  order: SalesOrder
): Customer | undefined {
  if (order.customerId) {
    const byId = customers.find((customer) => customer.id === order.customerId);
    if (byId) return byId;
  }

  const orderPhone = phoneDigits(order.phone || "");
  if (orderPhone) {
    const byPhone = customers.find(
      (customer) => phoneDigits(customer.phone || "") === orderPhone
    );
    if (byPhone) return byPhone;
  }

  return customers.find((customer) => customerMatchesOrder(customer, order));
}

export function getCustomerSummary(customers: Customer[]): CustomerSummary {
  const active = customers.filter((customer) => customer.status === "Active").length;
  const total = customers.length;

  return {
    total,
    active,
    activePct: total > 0 ? Math.round((active / total) * 1000) / 10 : 0,
    routes: new Set(customers.map((customer) => customer.route)).size,
    totalReceivable: customers.reduce((sum, customer) => sum + customer.outstanding, 0),
    receivableAccounts: customers.filter((customer) => customer.outstanding > 0).length,
    overLimit: customers.filter(isOverLimit).length,
  };
}

export function getStatusClasses(status: CustomerStatus): string {
  if (status === "Active") {
    return "bg-[#EBF5F0] text-[#2E7D58] border border-[#D1E8DC]";
  }
  if (status === "Blocked") {
    return "bg-error-container/50 text-error border border-error/20";
  }
  return "bg-surface-container-highest text-secondary border border-outline-variant";
}

export function getRowClasses(customer: Customer, selected: boolean): string {
  if (selected) return "bg-surface-container-high/60 hover:bg-surface-container";
  if (customer.status === "Inactive") return "bg-surface-variant/30 hover:bg-surface-container";
  if (customer.status === "Blocked") return "bg-error-container/10 hover:bg-surface-container";
  return "hover:bg-surface-container";
}

export function filterCustomers(customers: Customer[], filters: CustomerFilters): Customer[] {
  const query = filters.query.trim().toLowerCase();

  return customers.filter((customer) => {
    if (
      query &&
      !`${customer.name} ${customer.business} ${customer.phone} ${customer.id}`
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }
    if (filters.route !== "all" && customer.route !== filters.route) return false;
    if (filters.type !== "all" && customer.type !== filters.type) return false;
    if (filters.status !== "all" && customer.status !== filters.status) return false;
    if (filters.balance === "outstanding" && customer.outstanding <= 0) return false;
    if (filters.balance === "clear" && customer.outstanding > 0) return false;
    return true;
  });
}

export function sortCustomers(customers: Customer[], sort: CustomerSort): Customer[] {
  const sorted = [...customers];

  switch (sort) {
    case "outstanding-asc":
      return sorted.sort((a, b) => a.outstanding - b.outstanding);
    case "purchases-desc":
      return sorted.sort((a, b) => b.totalPurchases - a.totalPurchases);
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "activity-desc":
      return sorted.sort(
        (a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt)
      );
    case "outstanding-desc":
    default:
      return sorted.sort((a, b) => b.outstanding - a.outstanding);
  }
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function customersToCsv(customers: Customer[]): string {
  const rows = customers.map((customer) => [
    customer.code,
    customer.name,
    customer.business,
    customer.cityLabel,
    customer.routeLabel,
    customer.phone,
    customer.type,
    customer.orders,
    customer.totalPurchases,
    customer.outstanding,
    customer.creditLimit,
    customer.status,
  ]);

  return [
    "Ledger Code,Customer,Business,City,Route,Phone,Type,Orders,Total Purchases,Outstanding,Credit Limit,Status",
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
  if (typeof document === "undefined") return;

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
