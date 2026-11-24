import type { Product } from "../../app/products/types";
import type { StockMovementDto } from "../../app/inventory/data";
import { formatRs, toStockRows } from "../../app/inventory/utils";
import { formatStockWithPieces, parseMoneyInput } from "../../app/lib/units";
import type { SalesOrder } from "../sales-orders/types";
import type { Supplier } from "../suppliers/types";
import type {
  ActivityItem,
  DashboardKpis,
  LowStockRow,
  RecentOrder,
  SalesBucket,
  SalesPeriod,
  SalesPeriodSummary,
} from "./types";

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, amount: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function startOfWeek(value: Date): Date {
  const date = startOfDay(value);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** Date buckets use an exclusive upper bound so adjacent buckets never overlap. */
function inRange(date: Date, from: Date, to: Date): boolean {
  return date >= from && date < to;
}

function percentChange(current: number, previous: number): number {
  if (previous > 0) return ((current - previous) / previous) * 100;
  return current > 0 ? 100 : 0;
}

function safeAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function shortDate(value: Date): string {
  return value.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function localDateKey(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function parseOrders(orders: SalesOrder[]) {
  return orders
    .map((order) => ({ at: new Date(order.createdAt), amount: safeAmount(order.amount) }))
    .filter((point) => !Number.isNaN(point.at.getTime()));
}

function sumBetween(points: Array<{ at: Date; amount: number }>, from: Date, to: Date): number {
  return points.reduce((total, point) => total + (inRange(point.at, from, to) ? point.amount : 0), 0);
}

function sumOn(points: Array<{ at: Date; amount: number }>, day: Date): number {
  return points.reduce((total, point) => total + (isSameDay(point.at, day) ? point.amount : 0), 0);
}

export function getSalesBuckets(
  orders: SalesOrder[],
  period: SalesPeriod,
  now: Date
): SalesBucket[] {
  const points = parseOrders(orders);
  const buckets: SalesBucket[] = [];

  if (period === "daily") {
    const today = startOfDay(now);
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = addDays(today, -offset);
      const prior = addDays(date, -7);
      buckets.push({
        key: localDateKey(date),
        label: date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }),
        shortLabel: date.toLocaleDateString("en-GB", { weekday: "short" }),
        amount: sumOn(points, date),
        priorAmount: sumOn(points, prior),
        isCurrent: offset === 0,
      });
    }
    return buckets;
  }

  if (period === "weekly") {
    const currentWeek = startOfWeek(now);
    for (let offset = 5; offset >= 0; offset -= 1) {
      const from = addDays(currentWeek, -7 * offset);
      const to = addDays(from, 7);
      const displayTo = addDays(to, -1);
      const priorFrom = addDays(from, -7);
      const priorTo = from;
      buckets.push({
        key: `week-${localDateKey(from)}`,
        label: `${shortDate(from)} – ${shortDate(displayTo)}`,
        shortLabel: shortDate(from),
        amount: sumBetween(points, from, to),
        priorAmount: sumBetween(points, priorFrom, priorTo),
        isCurrent: offset === 0,
      });
    }
    return buckets;
  }

  if (period === "monthly") {
    const current = startOfMonth(now);
    for (let offset = 5; offset >= 0; offset -= 1) {
      const from = new Date(current.getFullYear(), current.getMonth() - offset, 1);
      const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
      const priorFrom = new Date(from.getFullYear() - 1, from.getMonth(), 1);
      const priorTo = new Date(from.getFullYear(), from.getMonth(), 1);
      buckets.push({
        key: `month-${from.getFullYear()}-${from.getMonth() + 1}`,
        label: from.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
        shortLabel: from.toLocaleDateString("en-GB", { month: "short" }),
        amount: sumBetween(points, from, to),
        priorAmount: sumBetween(points, priorFrom, priorTo),
        isCurrent: offset === 0,
      });
    }
    return buckets;
  }

  const today = startOfDay(now);
  const blockSize = 5;
  const currentEnd = addDays(today, 1);
  for (let offset = 5; offset >= 0; offset -= 1) {
    const to = addDays(currentEnd, -blockSize * offset);
    const from = addDays(to, -blockSize);
    const displayTo = addDays(to, -1);
    const priorTo = addDays(to, -30);
    const priorFrom = addDays(priorTo, -blockSize);
    buckets.push({
      key: `custom-${localDateKey(from)}`,
      label: `${shortDate(from)} – ${shortDate(displayTo)}`,
      shortLabel: shortDate(from),
      amount: sumBetween(points, from, to),
      priorAmount: sumBetween(points, priorFrom, priorTo),
      isCurrent: offset === 0,
    });
  }
  return buckets;
}

export function summarizeBuckets(buckets: SalesBucket[]): SalesPeriodSummary {
  const current = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const prior = buckets.reduce((sum, bucket) => sum + bucket.priorAmount, 0);
  return { current, prior, changePct: percentChange(current, prior) };
}

/**
 * Low stock is evaluated per inventory row.
 */
function collectLowStockRows(products: Product[]): LowStockRow[] {
  return products
    .flatMap((product) =>
      toStockRows(product)
        .filter((row) => row.status === "low" || row.status === "critical")
        .map((row) => ({
          id: row.id,
          productId: row.productId,
          title: row.name,
          sku: row.sku,
          available: row.available,
          unit: row.unit,
          threshold: row.minSafety,
          status: row.status,
        }))
    )
    .sort((a, b) => {
      const severityA = a.status === "critical" ? 0 : 1;
      const severityB = b.status === "critical" ? 0 : 1;
      if (severityA !== severityB) return severityA - severityB;
      const ratioA = a.threshold > 0 ? a.available / a.threshold : a.available;
      const ratioB = b.threshold > 0 ? b.available / b.threshold : b.available;
      if (ratioA !== ratioB) return ratioA - ratioB;
      return a.title.localeCompare(b.title);
    });
}

export function getDashboardKpis(
  products: Product[],
  orders: SalesOrder[],
  now: Date
): DashboardKpis {
  const today = startOfDay(now);
  const yesterday = addDays(today, -1);
  const weekStart = startOfWeek(now);
  const points = parseOrders(orders);

  const todaySales = sumOn(points, today);
  const yesterdaySales = sumOn(points, yesterday);
  const lowStock = collectLowStockRows(products);

  return {
    totalProducts: products.length,
    addedThisWeek: products.filter((product) => {
      if (!product.createdAt) return false;
      const created = new Date(product.createdAt);
      return !Number.isNaN(created.getTime()) && created >= weekStart && created <= now;
    }).length,
    activeProducts: products.filter((product) => product.catalogStatus === "active").length,
    todaySales,
    salesChangePct: percentChange(todaySales, yesterdaySales),
    stockValue: products.reduce((total, product) => {
      const stockPieces = safeAmount(product.openingStock);
      return total + stockPieces * (parseMoneyInput(product.purchasePrice) ?? 0);
    }, 0),
    lowStockCount: lowStock.length,
    urgentCount: lowStock.filter((row) => row.status === "critical").length,
  };
}

export function getRecentOrders(orders: SalesOrder[], limit = 5): RecentOrder[] {
  return [...orders]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit)
    .map((order) => ({
      id: order.id,
      customer: order.customer,
      location: order.location,
      amount: safeAmount(order.amount),
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentLabel: order.paymentLabel,
      terms:
        safeAmount(order.financials.outstanding) > 0
          ? `${formatRs(safeAmount(order.financials.outstanding))} bal.`
          : order.paymentMethod || order.paymentLabel,
    }));
}

/** `limit <= 0` returns every flagged row for the dashboard panel. */
export function getLowStockRows(products: Product[], limit = 0): LowStockRow[] {
  const rows = collectLowStockRows(products);
  return limit > 0 ? rows.slice(0, limit) : rows;
}

function relativeTime(value: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - value.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return value.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type ActivitySeed = Omit<ActivityItem, "time"> & { at: Date };

export function getActivityItems(
  products: Product[],
  movements: StockMovementDto[],
  orders: SalesOrder[],
  suppliers: Supplier[],
  now: Date,
  limit = 6
): ActivityItem[] {
  const seeds: ActivitySeed[] = [];

  movements.forEach((movement) => {
    const at = new Date(movement.createdAt);
    if (Number.isNaN(at.getTime())) return;
    seeds.push({
      id: `movement-${movement._id}`,
      kind: "movement",
      title: `Stock ${movement.direction === "in" ? "added to" : "deducted from"} ${movement.productTitle}`,
      detail: `${formatStockWithPieces(movement.quantity)} · ${
        movement.reason || movement.reference || movement.notes || "No reason recorded"
      } · ${movement.performedBy || "Admin"}`,
      tone: movement.direction === "in" ? "primary" : "error",
      href: "/inventory",
      at,
    });
  });

  orders.forEach((order) => {
    const at = new Date(order.createdAt);
    if (Number.isNaN(at.getTime())) return;
    seeds.push({
      id: `order-${order.id}`,
      kind: "order",
      title: `Order ${order.id} created for ${order.customer}`,
      detail: `${formatRs(safeAmount(order.amount))} · ${order.paymentLabel}`,
      tone: "success",
      href: "/sales-orders",
      at,
    });
  });

  products.forEach((product) => {
    if (!product.createdAt) return;
    const at = new Date(product.createdAt);
    if (Number.isNaN(at.getTime())) return;
    seeds.push({
      id: `product-${product._id}`,
      kind: "product",
      title: `Product ${product.title} added to catalog`,
      detail: `${product.sku} · ${product.category || "Uncategorised"}`,
      tone: "primary",
      href: "/products",
      at,
    });
  });

  suppliers.forEach((supplier) => {
    const at = new Date(supplier.createdAt);
    if (Number.isNaN(at.getTime())) return;
    seeds.push({
      id: `supplier-${supplier.id}`,
      kind: "supplier",
      title: `Supplier ${supplier.code} registered`,
      detail: `${supplier.name} · ${supplier.hub || supplier.region}`,
      tone: "secondary",
      href: "/suppliers",
      at,
    });
  });

  return seeds
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit)
    .map(({ at, ...item }) => ({ ...item, time: relativeTime(at, now) }));
}

export function chartGeometry(values: number[]) {
  const maxValue = Math.max(...values, 0);
  const magnitude = maxValue > 0 ? Math.pow(10, Math.floor(Math.log10(maxValue))) : 10;
  const niceMax = maxValue > 0 ? Math.ceil(maxValue / magnitude) * magnitude : magnitude;
  const denominator = Math.max(values.length - 1, 1);

  const points = values.map((value, index) => ({
    x: 50 + index * (720 / denominator),
    y: 180 - (safeAmount(value) / niceMax) * 160,
  }));

  const toPath = (source: Array<{ x: number; y: number }>) =>
    source.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return {
    points,
    currentPath: toPath(points),
    niceMax,
    gridValues: [1, 0.75, 0.5, 0.25, 0].map((ratio) => niceMax * ratio),
  };
}
