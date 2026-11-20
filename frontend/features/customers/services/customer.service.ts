import { apiFetch } from "../../../app/lib/api";
import type {
  CreateCustomerInput,
  Customer,
  CustomerDto,
  UpdateCustomerInput,
} from "../types";

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

function assertOk(response: Response, data: { message?: string }, fallback: string) {
  if (!response.ok) {
    throw new Error(data?.message || fallback);
  }
}

function toCustomer(dto: CustomerDto): Customer {
  return {
    id: dto._id,
    code: dto.ledgerCode,
    name: dto.name,
    business: dto.businessName,
    phone: dto.phone,
    altPhone: dto.altPhone || "",
    email: dto.email || "",
    city: dto.city,
    cityLabel: dto.cityLabel || dto.city,
    address: dto.address,
    type: dto.customerType,
    status: dto.status,
    route: dto.route,
    routeLabel: dto.routeLabel || dto.route,
    ntn: dto.ntn || "",
    creditLimit: Number(dto.creditLimit || 0),
    paymentTerms: dto.paymentTerms,
    openingBalance: Number(dto.openingBalance || 0),
    gracePeriod: dto.gracePeriod,
    notes: dto.notes || "",
    orders: Number(dto.orders || 0),
    totalPurchases: Number(dto.totalPurchases || 0),
    outstanding: Number(dto.outstanding || 0),
    createdBy: dto.createdBy || "Tariq M. (Owner)",
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt || dto.createdAt,
  };
}

export async function fetchNextCustomerCode(): Promise<string> {
  const response = await apiFetch("/api/customers/next-code");
  const data = await readJson(response);
  assertOk(response, data, "Failed to load the next customer ledger code");
  return String(data.code || "C-410");
}

export async function fetchCustomers(): Promise<Customer[]> {
  const response = await apiFetch("/api/customers");
  const data = await readJson(response);
  assertOk(response, data, "Failed to load customers");
  return Array.isArray(data.customers) ? data.customers.map(toCustomer) : [];
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const response = await apiFetch(`/api/customers/${encodeURIComponent(id)}`);
  const data = await readJson(response);
  assertOk(response, data, "Failed to load customer");
  return toCustomer(data.customer as CustomerDto);
}

export async function createCustomer(payload: CreateCustomerInput): Promise<Customer> {
  const response = await apiFetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to create customer");
  return toCustomer(data.customer as CustomerDto);
}

export async function updateCustomer(
  id: string,
  payload: UpdateCustomerInput
): Promise<Customer> {
  const response = await apiFetch(`/api/customers/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to update customer");
  return toCustomer(data.customer as CustomerDto);
}

export async function deleteCustomer(id: string): Promise<void> {
  const response = await apiFetch(`/api/customers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to delete customer");
}
