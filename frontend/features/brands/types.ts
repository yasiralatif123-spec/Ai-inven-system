export type Brand = {
  _id: string;
  name: string;
  normalizedName: string;
  description: string;
  isActive: boolean;
  productCount: number;
  businessId: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBrandInput = {
  name: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateBrandInput = CreateBrandInput;

export type BrandStatusFilter = "all" | "active" | "inactive";

export type BrandSort =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "products-desc";

export type BrandSummary = {
  total: number;
  active: number;
  inactive: number;
  products: number;
};
