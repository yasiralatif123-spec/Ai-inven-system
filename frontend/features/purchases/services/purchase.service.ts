import { apiFetch } from "../../../app/lib/api";
import type {
  CreatePurchasePayload,
  PurchaseDto,
  PurchasePaymentInput,
  PurchaseReceiveInput,
  PurchaseStatusUpdate,
} from "../types";

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

function assertOk(response: Response, data: { message?: string }, fallback: string) {
  if (!response.ok) {
    throw new Error(data?.message || fallback);
  }
}

export async function fetchNextPurchaseCode(): Promise<string> {
  const response = await apiFetch("/api/purchases/next-code");
  const data = await readJson(response);
  assertOk(response, data, "Failed to load the next purchase code");
  return String(data.code || "PO-2042");
}

export async function fetchPurchases(supplierId?: string): Promise<PurchaseDto[]> {
  const query = supplierId ? `?supplierId=${encodeURIComponent(supplierId)}` : "";
  const response = await apiFetch(`/api/purchases${query}`);
  const data = await readJson(response);
  assertOk(response, data, "Failed to load purchases");
  return Array.isArray(data.purchases) ? data.purchases : [];
}

export async function fetchPurchase(id: string): Promise<PurchaseDto> {
  const response = await apiFetch(`/api/purchases/${encodeURIComponent(id)}`);
  const data = await readJson(response);
  assertOk(response, data, "Failed to load the purchase");
  return data.purchase as PurchaseDto;
}

export async function createPurchase(payload: CreatePurchasePayload): Promise<PurchaseDto> {
  const response = await apiFetch("/api/purchases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to create purchase");
  return data.purchase as PurchaseDto;
}

export async function updatePurchase(
  id: string,
  payload: CreatePurchasePayload
): Promise<PurchaseDto> {
  const response = await apiFetch(`/api/purchases/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to update purchase");
  return data.purchase as PurchaseDto;
}

export async function updatePurchaseStatus(
  id: string,
  status: PurchaseStatusUpdate
): Promise<PurchaseDto> {
  const response = await apiFetch(`/api/purchases/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to update purchase status");
  return data.purchase as PurchaseDto;
}

export async function receivePurchase(
  id: string,
  payload: PurchaseReceiveInput
): Promise<PurchaseDto> {
  const response = await apiFetch(`/api/purchases/${encodeURIComponent(id)}/receive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to receive goods");
  return data.purchase as PurchaseDto;
}

export async function recordPurchasePayment(
  id: string,
  payload: PurchasePaymentInput
): Promise<PurchaseDto> {
  const response = await apiFetch(`/api/purchases/${encodeURIComponent(id)}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to record payment");
  return data.purchase as PurchaseDto;
}

export async function deletePurchase(id: string): Promise<void> {
  const response = await apiFetch(`/api/purchases/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to delete purchase");
}
