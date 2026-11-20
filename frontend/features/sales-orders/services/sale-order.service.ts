import { apiFetch } from "../../../app/lib/api";
import type {
  DateGroup,
  DraftOrderInput,
  OrderStatus,
  PaymentInput,
  SaleOrderDto,
  SalesOrder,
} from "../types";

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

function assertOk(response: Response, data: { message?: string }, fallback: string) {
  if (!response.ok) {
    throw new Error(data?.message || fallback);
  }
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function getDateGroup(date: Date, now = new Date()): DateGroup {
  if (date.toDateString() === now.toDateString()) return "today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "yesterday";

  return "older";
}

function formatOrderTime(date: Date, group: DateGroup): string {
  if (group === "today") return `Today ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (group === "yesterday") return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function toSalesOrder(dto: SaleOrderDto): SalesOrder {
  const createdAt = new Date(dto.createdAt);
  const dateGroup = getDateGroup(createdAt);

  return {
    id: dto.orderNumber,
    time: formatOrderTime(createdAt, dateGroup),
    dateGroup,
    customer: dto.customer.name,
    location: dto.customer.location,
    phone: dto.customer.phone,
    hub: dto.hub,
    skuCount: dto.skuCount,
    unitCount: dto.unitCount,
    amount: dto.amount,
    paymentStatus: dto.paymentStatus,
    paymentLabel: dto.paymentLabel,
    paymentMethod: dto.paymentMethod,
    status: dto.status,
    createdBy: dto.createdBy,
    createdAt: createdAt.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    bay: dto.bay,
    items: dto.items,
    financials: dto.financials,
  };
}

export async function fetchSaleOrders(): Promise<SalesOrder[]> {
  const response = await apiFetch("/api/sale-orders");
  const data = await readJson(response);
  assertOk(response, data, "Failed to load sale orders");
  return Array.isArray(data.orders) ? data.orders.map(toSalesOrder) : [];
}

export async function createSaleOrder(payload: DraftOrderInput): Promise<SalesOrder> {
  const response = await apiFetch("/api/sale-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to create sale order");
  return toSalesOrder(data.order as SaleOrderDto);
}

export async function updateSaleOrder(
  orderNumber: string,
  payload: DraftOrderInput
): Promise<SalesOrder> {
  const response = await apiFetch(`/api/sale-orders/${encodeURIComponent(orderNumber)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to update sale order");
  return toSalesOrder(data.order as SaleOrderDto);
}

export async function advanceSaleOrderStatus(
  orderNumber: string,
  status: OrderStatus
): Promise<SalesOrder> {
  const response = await apiFetch(
    `/api/sale-orders/${encodeURIComponent(orderNumber)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );
  const data = await readJson(response);
  assertOk(response, data, "Failed to update order status");
  return toSalesOrder(data.order as SaleOrderDto);
}

export async function recordSaleOrderPayment(
  orderNumber: string,
  payload: PaymentInput
): Promise<SalesOrder> {
  const response = await apiFetch(
    `/api/sale-orders/${encodeURIComponent(orderNumber)}/payment`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await readJson(response);
  assertOk(response, data, "Failed to record payment");
  return toSalesOrder(data.order as SaleOrderDto);
}

export async function deleteSaleOrder(orderNumber: string): Promise<void> {
  const response = await apiFetch(`/api/sale-orders/${encodeURIComponent(orderNumber)}`, {
    method: "DELETE",
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to delete sale order");
}
