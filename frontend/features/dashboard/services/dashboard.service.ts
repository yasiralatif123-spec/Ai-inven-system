import { fetchInventoryProducts, fetchStockMovements } from "../../../app/inventory/services/inventory.service";
import { fetchSaleOrders } from "../../sales-orders/services/sale-order.service";
import { fetchSuppliers } from "../../suppliers/services/supplier.service";
import type { DashboardSnapshot, SalesPeriod } from "../types";
import {
  getActivityItems,
  getDashboardKpis,
  getLowStockRows,
  getRecentOrders,
  getSalesBuckets,
  summarizeBuckets,
} from "../utils";

const PERIODS: SalesPeriod[] = ["daily", "weekly", "monthly", "custom"];

export async function fetchDashboardSnapshot(now = new Date()): Promise<DashboardSnapshot> {
  const [products, movements, orders, suppliers] = await Promise.all([
    fetchInventoryProducts(),
    fetchStockMovements(),
    fetchSaleOrders(),
    fetchSuppliers(),
  ]);

  const charts = PERIODS.reduce(
    (result, period) => {
      result[period] = getSalesBuckets(orders, period, now);
      return result;
    },
    {} as DashboardSnapshot["charts"]
  );

  const chartSummaries = PERIODS.reduce(
    (result, period) => {
      result[period] = summarizeBuckets(charts[period]);
      return result;
    },
    {} as DashboardSnapshot["chartSummaries"]
  );

  const today = now.toDateString();
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today);
  const outstandingOrders = orders.filter(
    (order) => Number(order.financials.outstanding) > 0
  );

  return {
    kpis: getDashboardKpis(products, orders, now),
    charts,
    chartSummaries,
    recentOrders: getRecentOrders(orders),
    orderTotals: {
      today: todayOrders.length,
      all: orders.length,
      outstanding: outstandingOrders.reduce(
        (sum, order) => sum + Number(order.financials.outstanding || 0),
        0
      ),
      outstandingCount: outstandingOrders.length,
    },
    lowStock: getLowStockRows(products),
    activity: getActivityItems(products, movements, orders, suppliers, now),
    sources: {
      products: products.length,
      movements: movements.length,
      orders: orders.length,
      suppliers: suppliers.length,
      generatedAt: now.toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      dateLabel: now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    },
  };
}
