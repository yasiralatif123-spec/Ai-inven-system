import type {
  HubKey,
  PaymentTerms,
  RegionFilter,
  SortOption,
  StatusFilter,
  TaxStatus,
} from "./types";

export const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "hold", label: "On Hold" },
  { value: "inactive", label: "Inactive" },
];

export const REGION_FILTER_OPTIONS: Array<{ value: RegionFilter; label: string }> = [
  { value: "all", label: "All Regions (Karachi, Lahore, Faisalabad)" },
  { value: "Karachi", label: "Karachi Hubs (SITE, Korangi, Gulshan)" },
  { value: "Lahore", label: "Lahore Hubs (Shah Alam, Badami Bagh)" },
  { value: "Faisalabad & Multan", label: "Faisalabad & Multan" },
  { value: "Rawalpindi & KPK", label: "Rawalpindi & KPK Corridor" },
];

export const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "payable-desc", label: "Payable Balance (High to Low)" },
  { value: "payable-asc", label: "Payable Balance (Low to High)" },
  { value: "purchases-desc", label: "Total Purchases (Vol High)" },
  { value: "date-desc", label: "Last Activity (Recent First)" },
  { value: "name-asc", label: "Supplier Name (A-Z)" },
];

export const HUB_OPTIONS: Array<{ value: HubKey; label: string }> = [
  { value: "", label: "Select Primary Supply Hub" },
  { value: "karachi", label: "Karachi (SITE / Korangi Hub)" },
  { value: "lahore", label: "Lahore (Shah Alam / Badami Bagh)" },
  { value: "faisalabad", label: "Faisalabad Central" },
  { value: "multan", label: "Multan Industrial" },
  { value: "rawalpindi", label: "Rawalpindi Grain Market" },
];

export const TAX_STATUS_OPTIONS: Array<{ value: TaxStatus; label: string }> = [
  { value: "standard", label: "Standard Active Filer (Full WHT)" },
  { value: "exempt", label: "Exempt / Reduced Rate 153(1)(a)" },
  { value: "non-filer", label: "Non-Filer (Subject to 200% WHT)" },
];

export const PAYMENT_TERM_OPTIONS: Array<{ value: PaymentTerms; label: string }> = [
  { value: "net-15", label: "Net 15 Days (Wholesale Standard)" },
  { value: "net-30", label: "Net 30 Days" },
  { value: "net-7", label: "Net 7 Days" },
  { value: "cod", label: "Cash on Delivery (COD)" },
  { value: "advance", label: "Advance Payment" },
];

export const GRACE_DAY_OPTIONS = [
  { value: 5, label: "5 Days grace buffer" },
  { value: 0, label: "No grace period" },
  { value: 10, label: "10 Days grace buffer" },
  { value: 15, label: "15 Days grace buffer" },
];
