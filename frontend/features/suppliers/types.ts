export type HubKey = "" | "karachi" | "lahore" | "faisalabad" | "multan" | "rawalpindi";
export type TaxStatus = "standard" | "exempt" | "non-filer";
export type PaymentTerms = "net-15" | "net-30" | "net-7" | "cod" | "advance";
export type SupplierStatus = "Active" | "On Hold" | "Inactive";

export type SupplierRegion =
  | "Karachi"
  | "Lahore"
  | "Faisalabad & Multan"
  | "Rawalpindi & KPK";

export type PayableTone = "danger" | "muted" | "success";

export type Supplier = {
  id: string;
  code: string;
  name: string;
  contact: string;
  hub: string;
  hubKey: HubKey;
  region: SupplierRegion;
  phone: string;
  email: string;
  taxStatus: TaxStatus;
  address: string;
  ntn: string;
  paymentTerms: PaymentTerms;
  openingBalance: number;
  graceDays: number;
  notes: string;
  createdBy: string;
  totalPurchases: number;
  outstanding: number;
  payableNote: string;
  payableTone: PayableTone;
  lastPurchase: string;
  lastPurchaseDate: string;
  createdAt: string;
  status: SupplierStatus;
  productIds: string[];
  aging?: boolean;
};

export type PayableFilter = "all" | "outstanding" | "clear";
export type StatusFilter = "all" | "active" | "hold" | "inactive";
export type RegionFilter = "all" | SupplierRegion;
export type SortOption =
  | "payable-desc"
  | "payable-asc"
  | "purchases-desc"
  | "date-desc"
  | "name-asc";

export type SupplierSummary = {
  total: number;
  active: number;
  onHold: number;
  inactive: number;
  newThisMonth: number;
  totalPayable: number;
  overdue: number;
  overdueAmount: number;
};

export type SupplierFilters = {
  query: string;
  payable: PayableFilter;
  status: StatusFilter;
  region: RegionFilter;
  sort: SortOption;
};

export type CreateSupplierInput = {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  hub: HubKey;
  taxStatus: TaxStatus;
  address: string;
  ntn: string;
  paymentTerms: PaymentTerms;
  openingBalance: number;
  graceDays: number;
  notes: string;
  productIds: string[];
};

export type UpdateSupplierInput = Omit<CreateSupplierInput, "openingBalance">;

export type SupplierDto = {
  _id: string;
  supplierCode: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  hub: string;
  region: string;
  taxStatus: TaxStatus;
  address: string;
  ntn: string;
  paymentTerms: PaymentTerms;
  openingBalance: number;
  graceDays: number;
  notes: string;
  status: SupplierStatus;
  totalPurchases: number;
  outstanding: number;
  payableNote: string;
  payableTone: PayableTone;
  lastPurchaseAt: string | null;
  productIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
