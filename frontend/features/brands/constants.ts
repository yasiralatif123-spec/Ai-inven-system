import type { BrandSort, BrandStatusFilter } from "./types";

export const BRAND_NAME_MAX_LENGTH = 120;
export const BRAND_DESCRIPTION_MAX_LENGTH = 500;

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export const STATUS_FILTER_OPTIONS: Array<{
  value: BrandStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const SORT_OPTIONS: Array<{ value: BrandSort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "products-desc", label: "Most products" },
];
