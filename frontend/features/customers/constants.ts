import type {
  BalanceFilter,
  City,
  CustomerRoute,
  CustomerSort,
  CustomerStatus,
  CustomerType,
} from "./types";

export const ROUTE_OPTIONS: Array<{ value: CustomerRoute; label: string }> = [
  { value: "lahore-central", label: "Lahore Central · Shah Alam & Brandreth" },
  { value: "lahore-north", label: "Lahore North · Badami Bagh & Ravi Belt" },
  { value: "lahore-south", label: "Lahore South · Kot Lakhpat & Ferozepur" },
  { value: "multan-road", label: "Lahore West · Multan Road Strip" },
  { value: "intercity-gt", label: "Intercity · GT Road Rawalpindi Cargo" },
  { value: "unassigned", label: "Unassigned Direct Counter" },
];

export const ROUTE_FILTER_OPTIONS = [
  { value: "all", label: "All Routes" },
  ...ROUTE_OPTIONS,
];

export const CUSTOMER_TYPE_OPTIONS: Array<{ value: CustomerType; label: string }> = [
  { value: "Wholesale", label: "Wholesale (Tier A - Bulk Price Matrix)" },
  { value: "Retailer", label: "Retailer (Tier B - Standard Commercial Trade)" },
  { value: "Distributor", label: "Distributor (Primary Channel Partner)" },
  { value: "Other", label: "Institutional / Government Procurement" },
];

export const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Types" },
  ...CUSTOMER_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label:
      option.value === "Other" ? "Institutional" : option.value === "Wholesale" ? "Wholesale FMCG" : option.value,
  })),
];

export const CITY_OPTIONS: Array<{ value: City; label: string }> = [
  { value: "Lahore", label: "Lahore (Central Punjab Hub)" },
  { value: "Karachi", label: "Karachi (Sindh Port Operations)" },
  { value: "Rawalpindi", label: "Rawalpindi / Islamabad (Capital Territory)" },
  { value: "Faisalabad", label: "Faisalabad (Textile Grid)" },
  { value: "Multan", label: "Multan (South Punjab Zone)" },
  { value: "Peshawar", label: "Peshawar (KP Northern Hub)" },
  { value: "Quetta", label: "Quetta (Balochistan Distribution)" },
  { value: "Gujranwala", label: "Gujranwala (Industrial Belt)" },
  { value: "Sialkot", label: "Sialkot (Export Processing)" },
];

export const STATUS_OPTIONS: Array<{ value: CustomerStatus; label: string }> = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Blocked", label: "Blocked" },
];

export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  ...STATUS_OPTIONS,
];

export const BALANCE_TABS: Array<{ value: BalanceFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "outstanding", label: "Outstanding" },
  { value: "clear", label: "Clear" },
];

export const SORT_OPTIONS: Array<{ value: CustomerSort; label: string }> = [
  { value: "outstanding-desc", label: "Outstanding Balance (High to Low)" },
  { value: "outstanding-asc", label: "Outstanding Balance (Low to High)" },
  { value: "purchases-desc", label: "Total Purchases (High to Low)" },
  { value: "name-asc", label: "Customer Name (A-Z)" },
  { value: "activity-desc", label: "Recent Account Activity" },
];

export const PAGE_SIZES = [10, 25, 50, 100] as const;
