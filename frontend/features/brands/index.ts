export { BrandAutocomplete } from "./components/BrandAutocomplete";
export { BrandDetailDialog } from "./components/BrandDetailDialog";
export { BrandFilters } from "./components/BrandFilters";
export { BrandFormDialog } from "./components/BrandFormDialog";
export { BrandSelect } from "./components/BrandSelect";
export { BrandStatusDialog } from "./components/BrandStatusDialog";
export { BrandsFooter } from "./components/BrandsFooter";
export { BrandsHeader } from "./components/BrandsHeader";
export { BrandsTable } from "./components/BrandsTable";
export { BrandsView } from "./components/BrandsView";
export { useBrandSearch } from "./hooks/useBrandSearch";
export { useBrands } from "./hooks/useBrands";
export {
  createBrand,
  fetchBrands,
  searchBrands,
  setBrandStatus,
  updateBrand,
} from "./services/brand.service";
export type {
  BrandQueryOptions,
  BrandSearchResult,
} from "./services/brand.service";
export type {
  Brand,
  BrandSort,
  BrandStatusFilter,
  BrandSummary,
  CreateBrandInput,
  UpdateBrandInput,
} from "./types";
export {
  filterBrands,
  formatBrandDate,
  getBrandSummary,
  normalizeBrandKey,
  normalizeBrandName,
  sortBrands,
  toBrand,
  validateBrandInput,
} from "./utils";
