import { BUSINESS_TODAY } from "@/lib/business/types";
import type { Order, OrderStatus } from "@/lib/orders/types";

const ACTIVE: Set<OrderStatus> = new Set([
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
  thisMonthCount: number;
  nextMonthCount: number;
  delayedCount: number;
  deliveredCount: number;
  totalRevenueThisMonth: number;
}

function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

function shiftMonth(yyyyMm: string, delta: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function buildWeddingOrdersOverview(
  orders: Order[],
  asOf: string = BUSINESS_TODAY
): WeddingOrdersOverview {
  const wedding = orders.filter(isWeddingOrder);
  const thisMonth = asOf.slice(0, 7);
  const nextMonth = shiftMonth(thisMonth, 1);

  const byMonth = new Map<string, Order[]>();
  for (const order of wedding) {
    const key = order.shootDate.slice(0, 7);
    const list = byMonth.get(key) ?? [];
    list.push(order);
    byMonth.set(key, list);
  }

  const groups: WeddingMonthGroup[] = [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, monthOrders]) => {
      const [y, m] = monthKey.split("-").map(Number);
      const delayed = monthOrders.filter(
        (o) =>
          ACTIVE.has(o.status) &&
          o.deliveryDate < asOf &&
          o.status !== "Delivered"
      ).length;
      const delivered = monthOrders.filter((o) => o.status === "Delivered")
        .length;
      const upcoming = monthOrders.filter(
        (o) => ACTIVE.has(o.status) && o.shootDate >= asOf
      ).length;
      return {
        year: y,
        month: m,
        monthKey,
        label: monthLabel(monthKey),
        orders: monthOrders.sort((a, b) =>
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
    });

  const thisMonthOrders = byMonth.get(thisMonth) ?? [];
  const nextMonthOrders = byMonth.get(nextMonth) ?? [];

  return {
    groups,
    thisMonthCount: thisMonthOrders.length,
    nextMonthCount: nextMonthOrders.length,
    delayedCount: wedding.filter(
      (o) =>
        ACTIVE.has(o.status) &&
        o.deliveryDate < asOf &&
        o.status !== "Delivered"
    ).length,
    deliveredCount: wedding.filter((o) => o.status === "Delivered").length,
    totalRevenueThisMonth: thisMonthOrders
      .filter((o) => o.status !== "Cancelled")
      .reduce((s, o) => s + o.price, 0),
  };
}
