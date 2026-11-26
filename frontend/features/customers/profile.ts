import type { PaymentStatus, SalesOrder } from "../sales-orders/types";
import type { Customer, PaymentTerms } from "./types";

export type CustomerActivity = {
  id: string;
  title: string;
  detail: string;
  date: string;
  tone: "primary" | "neutral" | "warning";
};

const PAYMENT_TERM_LABELS: Record<PaymentTerms, string> = {
  cod: "Cash on Delivery (COD)",
  "7days": "Net 7 Days",
  "15days": "Net 15 Days",
  "30days": "Net 30 Days",
  "45days": "Net 45 Days",
};

export function paymentTermsLabel(terms: PaymentTerms): string {
  return PAYMENT_TERM_LABELS[terms] || terms;
}

export function formatProfileDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function getCustomerFinancials(customer: Customer) {
  const openingBalance = Math.max(0, Number(customer.openingBalance) || 0);
  const orderOutstanding = Math.max(0, customer.outstanding - openingBalance);
  const totalPaid = Math.max(0, customer.totalPurchases - orderOutstanding);
  const headroom = customer.creditLimit - customer.outstanding;
  const exposure =
    customer.creditLimit > 0 ? Math.round((customer.outstanding / customer.creditLimit) * 1000) / 10 : 0;

  return {
    totalPaid,
    headroom,
    exposure,
    overLimit: headroom < 0,
    warning: exposure >= 80,
  };
}

export function buildCustomerActivity(orders: SalesOrder[]): CustomerActivity[] {
  return orders
    .flatMap((order) => {
      const items = order.items
        .slice(0, 2)
        .map((item) => item.name)
        .join(", ");
      const events: CustomerActivity[] = [];

      if (order.financials.paid > 0) {
        events.push({
          id: `${order.id}-payment`,
          title: `Payment received against ${order.id}`,
          detail: `${order.paymentMethod || "Cash"} · Order total ${order.amount.toLocaleString("en-PK")}`,
          date: order.createdAt,
          tone: "primary",
        });
      }

      events.push({
        id: `${order.id}-status`,
        title: `Order ${order.id} ${order.status.toLowerCase()}`,
        detail: `${order.unitCount} units${items ? ` · ${items}` : ""}`,
        date: order.createdAt,
        tone: order.status === "Delivered" ? "primary" : order.status === "Credit Hold" ? "warning" : "neutral",
      });

      return events;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPaymentBadgeClasses(status: PaymentStatus): string {
  if (status === "paid") {
    return "bg-success-container text-success border-success-border";
  }
  if (status === "partial") {
    return "bg-warning-container text-warning border-warning-border";
  }
  return "bg-error-container text-error border-error-border";
}

export function getFulfillmentBadgeClasses(status: SalesOrder["status"]): string {
  if (status === "Delivered") {
    return "bg-success-container text-success border-success-border";
  }
  if (status === "Credit Hold") {
    return "bg-error-container text-error border-error-border";
  }
  return "bg-surface-container text-on-surface-variant border-outline-variant";
}
