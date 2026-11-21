import { apiFetch } from "../../lib/api";
import type { Product } from "../../products/types";
import type { StockMovementDto } from "../data";

export type AdjustStockPayload = {
  direction: "add" | "deduct";
  quantity: number;
  flavor?: string;
  reason?: string;
  reference?: string;
  notes?: string;
};

export type AdjustStockResult = {
  message: string;
  product: Product;
  movement: StockMovementDto;
};

export type DeleteStockMovementResult = {
  message: string;
  product: Product;
  movement: StockMovementDto;
};

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export async function fetchInventoryProducts(): Promise<Product[]> {
  const response = await apiFetch("/api/products");
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load products");
  }

  return Array.isArray(data.products) ? data.products : [];
}

export async function fetchStockMovements(): Promise<StockMovementDto[]> {
  const response = await apiFetch("/api/inventory/movements");
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load stock movements");
  }

  return Array.isArray(data.movements) ? data.movements : [];
}

export async function adjustStock(
  productId: string,
  payload: AdjustStockPayload
): Promise<AdjustStockResult> {
  const response = await apiFetch(
    `/api/products/${encodeURIComponent(productId)}/adjust-stock`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to adjust stock");
  }

  return data as AdjustStockResult;
}

export async function deleteStockMovement(
  movementId: string
): Promise<DeleteStockMovementResult> {
  const response = await apiFetch(
    `/api/inventory/movements/${encodeURIComponent(movementId)}`,
    { method: "DELETE" }
  );
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to delete stock adjustment");
  }

  return data as DeleteStockMovementResult;
}
