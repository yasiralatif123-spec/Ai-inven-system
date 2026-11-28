import type { OpeningBalancePaymentRecord } from "../profiles/types";

export type CustomerStatus = "Active" | "Inactive" | "Blocked";

export type CustomerType = "Wholesale" | "Retailer" | "Distributor" | "Other";

export type City =
  | "Lahore"
  | "Karachi"
  | "Rawalpindi"
  | "Faisalabad"
  | "Multan"
  | "Peshawar"
  | "Quetta"
  | "Gujranwala"
  | "Sialkot";

export type CustomerRoute =
  | "lahore-central"
  | "lahore-north"
  | "lahore-south"
  | "multan-road"
  | "intercity-gt"
  | "unassigned";

export type PaymentTerms = "cod" | "7days" | "15days" | "30days" | "45days";

export type GracePeriod = "none" | "3days" | "5days" | "7days";

export type Customer = {
  id: string;
  code: string;
  name: string;
  business: string;
  phone: string;
  altPhone: string;
  email: string;
  city: City;
  cityLabel: string;
  address: string;
  type: CustomerType;
  status: CustomerStatus;
  route: CustomerRoute;
  routeLabel: string;
  ntn: string;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  openingBalance: number;
  openingBalancePaid: number;
  remainingOpeningBalance: number;
  openingBalancePayments: OpeningBalancePaymentRecord[];
  gracePeriod: GracePeriod;
  notes: string;
  orders: number;
  totalPurchases: number;
  outstanding: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type BalanceFilter = "all" | "outstanding" | "clear";

export type CustomerSort =
  | "outstanding-desc"
  | "outstanding-asc"
  | "purchases-desc"
  | "name-asc"
  | "activity-desc";

export type CustomerFilters = {
  query: string;
  route: string;
  type: string;
  status: string;
  balance: BalanceFilter;
  sort: CustomerSort;
};

export type CustomerSummary = {
  total: number;
  active: number;
  activePct: number;
  routes: number;
  totalReceivable: number;
  receivableAccounts: number;
  overLimit: number;
};

export type CreateCustomerInput = {
  name: string;
  businessName: string;
  phone: string;
  altPhone: string;
  email: string;
  city: City;
  address: string;
  customerType: CustomerType;
  status: CustomerStatus;
  route: CustomerRoute;
  ntn: string;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  openingBalance: number;
  gracePeriod: GracePeriod;
  notes: string;
};

export type UpdateCustomerInput = Omit<
  CreateCustomerInput,
  "creditLimit" | "paymentTerms" | "openingBalance" | "gracePeriod"
>;

export type CustomerDto = {
  _id: string;
  ledgerCode: string;
  name: string;
  businessName: string;
  phone: string;
  altPhone: string;
  email: string;
  city: City;
  cityLabel: string;
  address: string;
  customerType: CustomerType;
  status: CustomerStatus;
  route: CustomerRoute;
  routeLabel: string;
  ntn: string;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  openingBalance: number;
  openingBalancePaid: number;
  remainingOpeningBalance: number;
  openingBalancePayments: OpeningBalancePaymentRecord[];
  gracePeriod: GracePeriod;
  notes: string;
  orders: number;
  totalPurchases: number;
  outstanding: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
