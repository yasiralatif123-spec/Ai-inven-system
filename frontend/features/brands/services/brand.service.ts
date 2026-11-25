import { apiFetch } from "../../../app/lib/api";
import type { Brand, CreateBrandInput, UpdateBrandInput } from "../types";
import { toBrand } from "../utils";

type JsonObject = Record<string, unknown>;

async function readJson(response: Response): Promise<JsonObject> {
  const data = await response.json().catch(() => ({}));
  return data && typeof data === "object" ? (data as JsonObject) : {};
}

function assertOk(response: Response, data: JsonObject, fallback: string) {
  if (!response.ok) {
    throw new Error(typeof data.message === "string" ? data.message : fallback);
  }
}

function extractBrand(data: JsonObject, fallback: string): Brand {
  const brand = toBrand(data.brand);
  if (!brand) throw new Error(fallback);
  return brand;
}

export type BrandQueryOptions = {
  search?: string;
  active?: boolean;
  limit?: number;
  page?: number;
};

export type BrandSearchResult = {
  brands: Brand[];
  total: number;
  page: number;
  pageSize: number | null;
  hasMore: boolean;
};

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

async function requestBrands(options: BrandQueryOptions = {}): Promise<BrandSearchResult> {
  const params = new URLSearchParams();
  const search = (options.search || "").trim();
  if (search) params.set("search", search);
  if (options.active !== undefined) params.set("active", String(options.active));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  if (options.page !== undefined) params.set("page", String(options.page));

  const query = params.toString();
  const response = await apiFetch(`/api/brands${query ? `?${query}` : ""}`);
  const data = await readJson(response);
  assertOk(response, data, "Failed to load brands");

  const brands = Array.isArray(data.brands)
    ? data.brands.map(toBrand).filter((brand): brand is Brand => Boolean(brand))
    : [];

  return {
    brands,
    total: numberOr(data.total, brands.length),
    page: numberOr(data.page, 1),
    pageSize: typeof data.pageSize === "number" ? data.pageSize : null,
    hasMore: data.hasMore === true,
  };
}

/** Full list used by the Brands page; omitting limit preserves legacy behavior. */
export async function fetchBrands(
  options: Omit<BrandQueryOptions, "limit" | "page"> = {}
): Promise<Brand[]> {
  return (await requestBrands(options)).brands;
}

/** Bounded, server-filtered page for type-ahead selectors. */
export async function searchBrands(
  options: BrandQueryOptions = {}
): Promise<BrandSearchResult> {
  return requestBrands(options);
}

export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  const response = await apiFetch("/api/brands", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to create brand");
  return extractBrand(data, "Brand was created but the response was empty");
}

export async function updateBrand(
  id: string,
  input: UpdateBrandInput
): Promise<Brand> {
  const response = await apiFetch(`/api/brands/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson(response);
  assertOk(response, data, "Failed to update brand");
  return extractBrand(data, "Brand was updated but the response was empty");
}

export async function setBrandStatus(
  id: string,
  isActive: boolean
): Promise<Brand> {
  const response = await apiFetch(
    `/api/brands/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    }
  );
  const data = await readJson(response);
  assertOk(response, data, "Failed to update brand status");
  return extractBrand(data, "Brand status was updated but the response was empty");
}
