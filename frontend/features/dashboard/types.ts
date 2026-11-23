import type { OrderStatus, PaymentStatus } from "../sales-orders/types";
import type { StockStatus } from "../../app/inventory/data";

export type SalesPeriod = "daily" | "weekly" | "monthly" | "custom";

export type SalesBucket = {
  key: string;
  label: string;
  shortLabel: string;
  amount: number;
  priorAmount: number;
  isCurrent: boolean;
};

export type SalesPeriodSummary = {
  current: number;
  prior: number;
  changePct: number;
};

export type DashboardKpis = {
  totalProducts: number;
  addedThisWeek: number;
  activeProducts: number;
  todaySales: number;
  salesChangePct: number;
  stockValue: number;
  lowStockCount: number;
  urgentCount: number;
};

export type RecentOrder = {
  id: string;
  customer: string;
  location: string;
  amount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentLabel: string;
  terms: string;
};

export type LowStockRow = {
  id: string;
  productId: string;
  title: string;
  sku: string;
  available: number;
  unit: string;
  threshold: number;
  status: StockStatus;
};

export type ActivityKind = "movement" | "order" | "product" | "supplier";
export type ActivityTone = "primary" | "success" | "secondary" | "error";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  time: string;
  tone: ActivityTone;
  href: string;
};

export type DashboardSources = {
  products: number;
  movements: number;
  orders: number;
  suppliers: number;
  generatedAt: string;
  dateLabel: string;
};

export type DashboardSnapshot = {
  kpis: DashboardKpis;
  charts: Record<SalesPeriod, SalesBucket[]>;
  chartSummaries: Record<SalesPeriod, SalesPeriodSummary>;
  recentOrders: RecentOrder[];
  orderTotals: {
    today: number;
    all: number;
    outstanding: number;
    outstandingCount: number;
  };
  lowStock: LowStockRow[];
  activity: ActivityItem[];
  sources: DashboardSources;
};
