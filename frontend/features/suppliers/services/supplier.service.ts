import { apiFetch } from "../../../app/lib/api";
import { HUB_OPTIONS } from "../constants";
import type {
  CreateSupplierInput,
  HubKey,
  Supplier,
  SupplierDto,
  UpdateSupplierInput,
} from "../types";

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

function assertOk(response: Response, data: { message?: string }, fallback: string) {
  if (!response.ok) {
    throw new Error(data?.message || fallback);
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toHubKey(dto: SupplierDto): HubKey {
  const matched = HUB_OPTIONS.find((option) => option.value && option.label === dto.hub);
  if (matched) return matched.value;

  if (dto.region === "Karachi") return "karachi";
  if (dto.region === "Lahore") return "lahore";
  if (dto.region === "Rawalpindi & KPK") return "rawalpindi";
  if (dto.region === "Faisalabad & Multan") return "faisalabad";
  return "";
}

function toSupplier(dto: SupplierDto): Supplier {
  const hasPurchase = Boolean(dto.lastPurchaseAt);
  const lastPurchaseDate = dto.lastPurchaseAt || dto.createdAt;

  return {
    id: dto._id,
    code: dto.supplierCode,
    name: dto.name,
    contact: dto.contactPerson,
    hub: dto.hub || dto.region || "—",
    hubKey: toHubKey(dto),
    region: (dto.region || "Karachi") as Supplier["region"],
    phone: dto.phone,
    email: dto.email || "",
    taxStatus: dto.taxStatus,
    address: dto.address || "",
    ntn: dto.ntn || "",
    paymentTerms: dto.paymentTerms,
    openingBalance: Number(dto.openingBalance || 0),
    graceDays: Number(dto.graceDays || 0),
    notes: dto.notes || "",
    createdBy: dto.createdBy || "—",
    totalPurchases: dto.totalPurchases,
    outstanding: dto.outstanding,
    payableNote: dto.payableNote,
    payableTone: dto.payableTone,
    lastPurchase: hasPurchase ? formatDate(dto.lastPurchaseAt as string) : "—",
    lastPurchaseDate,
    createdAt: dto.createdAt,
    status: dto.status,
    productIds: Array.isArray(dto.productIds) ? dto.productIds.map(String) : [],
    aging: false,
  };
}

export async function fetchNextSupplierCode(): Promise<string> {
  const response = await apiFetch("/api/suppliers/next-code");
  const data = await readJson(response);
  assertOk(response, data, "Failed to load the next supplier code");
  return String(data.code || "S-208");
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const response = await apiFetch("/api/suppliers");
  const data = await readJson(response);
  assertOk(response, data, "Failed to load suppliers");
  return Array.isArray(data.suppliers) ? data.suppliers.map(toSupplier) : [];
}

export async function fetchSupplier(id: string): Promise<Supplier> {
  const response = await apiFetch(`/api/suppliers/${encodeURIComponent(id)}`);
  const data = await readJson(response);
  assertOk(response, data, "Failed to load the supplier");
  return toSupplier(data.supplier as SupplierDto);
}

export async function createSupplier(payload: CreateSupplierInput): Promise<Supplier> {
  const response = await apiFetch("/api/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to create supplier");
  return toSupplier(data.supplier as SupplierDto);
}

export async function updateSupplier(
  id: string,
  payload: UpdateSupplierInput
): Promise<Supplier> {
  const response = await apiFetch(`/api/suppliers/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to update supplier");
  return toSupplier(data.supplier as SupplierDto);
}

export async function deleteSupplier(id: string): Promise<void> {
  const response = await apiFetch(`/api/suppliers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to delete supplier");
}
