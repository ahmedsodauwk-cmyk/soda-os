/**
 * Wedding orders — year → month browser with empty months visible.
 */

import { getBusinessToday } from "@/lib/business/types";
import type { Order, OrderStatus } from "@/lib/orders/types";

const ACTIVE: Set<OrderStatus> = new Set([
  "Holding",
  "Confirmed",
  "Pending",
  "Scheduled",
  "Shooting",
  "Editing",
]);

export function isWeddingOrder(order: Order): boolean {
  return (
    order.workspaceId === "weddings" ||
    order.projectType === "Wedding" ||
    order.projectType === "Engagement"
  );
}

export function isCommercialOrder(order: Order): boolean {
  return (
    order.projectType === "Commercial" ||
    order.workspaceId === "commercial" ||
    order.workspaceId === "rtm" ||
    order.workspaceId === "product"
  );
}

export interface WeddingMonthGroup {
  year: number;
  month: number;
  monthKey: string;
  label: string;
  orders: Order[];
  count: number;
  delayed: number;
  delivered: number;
  upcoming: number;
  revenue: number;
}

export interface WeddingOrdersOverview {
  groups: WeddingMonthGroup[];
  /** All months for a selected year (Jan–Dec), including empty. */
  yearMonths: WeddingMonthGroup[];
  /** Years available in the browser (current + next when auto). */
  years: number[];
  thisMonthCount: number;
  nextMonthCount: number;
  delayedCount: number;
  deliveredCount: number;
  totalRevenueThisMonth: number;
}

function monthLabel(yyyyMm: string, locale = "en-GB"): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y!, m! - 1, 1)));
}

function shiftMonth(yyyyMm: string, delta: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function buildMonthGroup(
  key: string,
  monthOrders: Order[],
  asOf: string
): WeddingMonthGroup {
  const [y, m] = key.split("-").map(Number);
  const delayed = monthOrders.filter(
    (o) =>
      ACTIVE.has(o.status) &&
      o.deliveryDate < asOf &&
      o.status !== "Delivered" &&
      o.status !== "Completed"
  ).length;
  const delivered = monthOrders.filter(
    (o) => o.status === "Delivered" || o.status === "Completed"
  ).length;
  const upcoming = monthOrders.filter(
    (o) => ACTIVE.has(o.status) && o.shootDate >= asOf
  ).length;
  return {
    year: y!,
    month: m!,
    monthKey: key,
    label: monthLabel(key),
    orders: [...monthOrders].sort((a, b) =>
      a.shootDate.localeCompare(b.shootDate)
    ),
    count: monthOrders.length,
    delayed,
    delivered,
    upcoming,
    revenue: monthOrders
      .filter((o) => o.status !== "Cancelled")
      .reduce((s, o) => s + o.price, 0),
  };
}

/** Years to show: current calendar year, and next year once we're in H2 or have next-year orders. */
export function weddingBrowserYears(
  orders: Order[],
  asOf: string = getBusinessToday()
): number[] {
  const currentYear = Number(asOf.slice(0, 4));
  const month = Number(asOf.slice(5, 7));
  const wedding = orders.filter(isWeddingOrder);
  const hasNextYearOrders = wedding.some(
    (o) => Number(o.shootDate.slice(0, 4)) >= currentYear + 1
  );
  const years = [currentYear];
  // Auto-include next year from July onward, or when next-year orders exist.
  if (month >= 7 || hasNextYearOrders || currentYear === 2026) {
    years.push(currentYear + 1);
  }
  // Include any earlier years that have wedding shoots.
  for (const o of wedding) {
    const y = Number(o.shootDate.slice(0, 4));
    if (y < currentYear && !years.includes(y)) years.push(y);
  }
  return [...years].sort((a, b) => a - b);
}

export function buildWeddingYearMonths(
  orders: Order[],
  year: number,
  asOf: string = getBusinessToday()
): WeddingMonthGroup[] {
  const wedding = orders.filter(isWeddingOrder);
  const byMonth = new Map<string, Order[]>();
  for (const order of wedding) {
    const key = order.shootDate.slice(0, 7);
    if (!key.startsWith(String(year))) continue;
    const list = byMonth.get(key) ?? [];
    list.push(order);
    byMonth.set(key, list);
  }

  const months: WeddingMonthGroup[] = [];
  for (let m = 1; m <= 12; m++) {
    const key = monthKey(year, m);
    months.push(buildMonthGroup(key, byMonth.get(key) ?? [], asOf));
  }
  return months;
}

export function buildWeddingOrdersOverview(
  orders: Order[],
  asOf: string = getBusinessToday(),
  selectedYear?: number
): WeddingOrdersOverview {
  const wedding = orders.filter(isWeddingOrder);
  const thisMonth = asOf.slice(0, 7);
  const nextMonth = shiftMonth(thisMonth, 1);
  const years = weddingBrowserYears(orders, asOf);
  const year =
    selectedYear && years.includes(selectedYear)
      ? selectedYear
      : years.includes(Number(asOf.slice(0, 4)))
        ? Number(asOf.slice(0, 4))
        : years[years.length - 1]!;

  const byMonth = new Map<string, Order[]>();
  for (const order of wedding) {
    const key = order.shootDate.slice(0, 7);
    const list = byMonth.get(key) ?? [];
    list.push(order);
    byMonth.set(key, list);
  }

  const groups: WeddingMonthGroup[] = [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, monthOrders]) => buildMonthGroup(key, monthOrders, asOf));

  const thisMonthOrders = byMonth.get(thisMonth) ?? [];
  const nextMonthOrders = byMonth.get(nextMonth) ?? [];

  return {
    groups,
    yearMonths: buildWeddingYearMonths(orders, year, asOf),
    years,
    thisMonthCount: thisMonthOrders.length,
    nextMonthCount: nextMonthOrders.length,
    delayedCount: wedding.filter(
      (o) =>
        ACTIVE.has(o.status) &&
        o.deliveryDate < asOf &&
        o.status !== "Delivered" &&
        o.status !== "Completed"
    ).length,
    deliveredCount: wedding.filter(
      (o) => o.status === "Delivered" || o.status === "Completed"
    ).length,
    totalRevenueThisMonth: thisMonthOrders
      .filter((o) => o.status !== "Cancelled")
      .reduce((s, o) => s + o.price, 0),
  };
}
