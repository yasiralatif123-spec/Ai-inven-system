import {
  BRAND_DESCRIPTION_MAX_LENGTH,
  BRAND_NAME_MAX_LENGTH,
} from "./constants";
import type {
  Brand,
  BrandSort,
  BrandStatusFilter,
  BrandSummary,
  CreateBrandInput,
} from "./types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function idToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toString" in value) {
    return String(value);
  }
  return "";
}

export function toBrand(value: unknown): Brand | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = idToString(row._id);
  const name = normalizeBrandName(asString(row.name));
  if (!id || !name) return null;

  return {
    _id: id,
    name,
    normalizedName: normalizeBrandKey(asString(row.normalizedName) || name),
    description: asString(row.description),
    isActive: asBoolean(row.isActive, true),
    productCount: asNumber(row.productCount),
    businessId: idToString(row.businessId) || null,
    createdByUserId: idToString(row.createdByUserId) || null,
    createdAt: asString(row.createdAt),
    updatedAt: asString(row.updatedAt),
  };
}

export function normalizeBrandName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeBrandKey(value: string): string {
  return normalizeBrandName(value).toLowerCase();
}

export function validateBrandInput(
  input: CreateBrandInput,
  brands: Brand[],
  currentBrandId?: string
): string | null {
  const name = normalizeBrandName(input.name);
  if (!name) return "Brand name is required.";
  if (name.length > BRAND_NAME_MAX_LENGTH) {
    return `Brand name must be ${BRAND_NAME_MAX_LENGTH} characters or fewer.`;
  }

  const description = (input.description || "").trim();
  if (description.length > BRAND_DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${BRAND_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  const key = normalizeBrandKey(name);
  const duplicate = brands.find(
    (brand) =>
      brand._id !== currentBrandId && normalizeBrandKey(brand.name) === key
  );
  if (duplicate) return "A brand with this name already exists.";

  return null;
}

export function filterBrands(
  brands: Brand[],
  query: string,
  status: BrandStatusFilter
): Brand[] {
  const needle = normalizeBrandKey(query);
  return brands.filter((brand) => {
    if (status === "active" && !brand.isActive) return false;
    if (status === "inactive" && brand.isActive) return false;
    if (!needle) return true;
    return (
      normalizeBrandKey(brand.name).includes(needle) ||
      normalizeBrandKey(brand.description).includes(needle)
    );
  });
}

export function sortBrands(brands: Brand[], sort: BrandSort): Brand[] {
  const sorted = [...brands];
  switch (sort) {
    case "oldest":
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "products-desc":
      return sorted.sort(
        (a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name)
      );
    case "newest":
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export function getBrandSummary(brands: Brand[]): BrandSummary {
  return brands.reduce<BrandSummary>(
    (summary, brand) => {
      summary.total += 1;
      if (brand.isActive) summary.active += 1;
      else summary.inactive += 1;
      summary.products += brand.productCount;
      return summary;
    },
    { total: 0, active: 0, inactive: 0, products: 0 }
  );
}

export function formatBrandDate(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatProductCount(count: number): string {
  return `${count} ${count === 1 ? "product" : "products"}`;
}
