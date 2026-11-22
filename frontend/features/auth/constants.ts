import type { AccountFormValues, BusinessFormValues, LoginFormValues } from "./types";

export const INITIAL_ACCOUNT_VALUES: AccountFormValues = {
  fullName: "Tariq Mahmood",
  email: "tariq@karachiwholesale.pk",
  phone: "300 2489102",
  password: "Karpak@2026!",
  confirmPassword: "Karpak@2025",
  termsAccepted: false,
};

export const INITIAL_BUSINESS_VALUES: BusinessFormValues = {
  businessName: "Karachi Wholesale Mart & Goods",
  businessType: "Wholesale",
  city: "Karachi (Jodia Bazaar / SITE)",
  currency: "PKR (Rs.)",
  timezone: "Asia/Karachi",
};

export const BUSINESS_TYPE_OPTIONS = ["Wholesale", "Retail", "Distributor", "Other"] as const;

export const CURRENCY_OPTIONS = ["PKR (Rs.)", "USD ($)", "AED (د.إ)"] as const;

export const TIMEZONE_OPTIONS = ["Asia/Karachi", "Asia/Dubai", "UTC (+00:00)"] as const;

export const WORKSPACE_FEATURES = [
  { title: "Track stock and every movement", meta: "SKUs & Cartons" },
  { title: "Manage customer and supplier balances", meta: "Mercantile Ledger" },
  { title: "Record payments against invoices", meta: "Multi-voucher sync" },
  { title: "Get low-stock alerts", meta: "Automatic" },
] as const;

export const INITIAL_LOGIN_VALUES: LoginFormValues = {
  email: "tariq@karachiwholesale.pk",
  password: "Karpak@2026!",
  keepSignedIn: true,
};

export const DASHBOARD_PREVIEW_KPIS = [
  {
    label: "Total Stock SKU",
    value: "1,420",
    note: "98.4% Available",
    noteClass: "text-emerald-700",
    highlighted: false,
  },
  {
    label: "Today's Sales",
    value: "Rs. 84,750",
    note: "18 Dispatch Orders",
    noteClass: "text-[#68645C]",
    highlighted: false,
  },
  {
    label: "Pending Dispatches",
    value: "7",
    note: "2 Loading at Hub",
    noteClass: "text-amber-700",
    highlighted: false,
  },
  {
    label: "Overdue Payables",
    value: "5 Accounts",
    note: "Rs. 6,66,300 Aging",
    noteClass: "text-[#991B1B]/80",
    highlighted: true,
  },
] as const;

export const DASHBOARD_PREVIEW_ORDERS = [
  {
    orderId: "ORD-1088",
    customer: "Ahmed Traders",
    location: "Shah Alam, LHR",
    manifest: "14 cartons (Dalda, Mezan Oil)",
    amount: "28,500",
    status: "PROCESSING",
    statusClass: "bg-amber-50 text-amber-800 border-amber-200",
    muted: false,
  },
  {
    orderId: "ORD-1082",
    customer: "Madina Karyana Store",
    location: "SITE Hub, KHI",
    manifest: "8 crates (Tapal Danedar 950g)",
    amount: "45,000",
    status: "DISPATCHED",
    statusClass: "bg-blue-50 text-blue-800 border-blue-200",
    muted: false,
  },
  {
    orderId: "ORD-1075",
    customer: "Karachi Beverage Dist.",
    location: "Godown #3, KHI",
    manifest: "70 cartons Pakola & Pepsi 1.5L",
    amount: "1,65,000",
    status: "DELIVERED",
    statusClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    muted: false,
  },
  {
    orderId: "ORD-1064",
    customer: "Bismillah General Store",
    location: "",
    manifest: "25 bags Guard Basmati Rice",
    amount: "62,000",
    status: "DELIVERED",
    statusClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    muted: true,
  },
] as const;
