/**
 * Rotating Command Center summaries — built only from real dashboard / repo data.
 */

import { buildWeddingOrdersOverview } from "@/lib/business/wedding-orders";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { getOrders } from "@/lib/orders/repository";
import { getPayments } from "@/lib/payments/repository";
import { computeQuotationMetrics } from "@/lib/quotations";

export type RotatingSummaryKey =
  | "operations"
  | "weddings"
  | "commercial"
  | "quotations"
  | "deliveries"
  | "payments"
  | "crew"
  | "revenue"
  | "deadlines";

export interface RotatingSummaryPanel {
  key: RotatingSummaryKey;
  title: string;
  description: string;
  href: string;
  lines: { label: string; value: string; href?: string }[];
}

const ROTATE_MS = 18_000;

export function getRotatingSummaryMs(): number {
  return ROTATE_MS;
}

function egp(n: number): string {
  return `${Math.round(n).toLocaleString("en-EG")} EGP`;
}

/** Build only panels that have meaningful real data (skip empty). */
export function buildRotatingSummaries(
  snapshot: DashboardSnapshot
): RotatingSummaryPanel[] {
  const panels: RotatingSummaryPanel[] = [];
  const orders = getOrders();
  const wedding = buildWeddingOrdersOverview(orders, snapshot.asOf);

  // Today's Operations
  panels.push({
    key: "operations",
    title: "Today's Operations",
    description: "Live KPIs from orders, projects, and schedule.",
    href: "/orders",
    lines: [
      {
        label: "Active orders",
        value: String(snapshot.kpis.activeOrders),
        href: "/orders",
      },
      {
        label: "Shoots today",
        value: String(snapshot.schedule.todayShoots.length),
        href: "/calendar",
      },
      {
        label: "Deliveries today",
        value: String(
          snapshot.schedule.deliveries.filter((d) => d.when === "today").length
        ),
        href: "/orders",
      },
      {
        label: "Needs attention",
        value: String(snapshot.attention.length),
        href: "/attention",
      },
    ],
  });

  // Upcoming Weddings
  if (wedding.thisMonthCount > 0 || wedding.nextMonthCount > 0) {
    panels.push({
      key: "weddings",
      title: "Upcoming Weddings",
      description: "Wedding pipeline from real order data.",
      href: "/orders/weddings",
      lines: [
        {
          label: "This month",
          value: `${wedding.thisMonthCount} · ${egp(wedding.totalRevenueThisMonth)}`,
          href: "/orders/weddings",
        },
        {
          label: "Next month",
          value: String(wedding.nextMonthCount),
          href: "/orders/weddings",
        },
        {
          label: "Delayed",
          value: String(wedding.delayedCount),
          href: "/orders/weddings",
        },
      ],
    });
  }

  // Commercial Pipeline
  const commercialWs = snapshot.workspaces.filter(
    (w) => w.slug !== "weddings" && (w.activeProjects > 0 || w.orders > 0)
  );
  if (commercialWs.length > 0) {
    panels.push({
      key: "commercial",
      title: "Commercial Pipeline",
      description: "Active commercial lanes and revenue.",
      href: "/commercial",
      lines: commercialWs.slice(0, 4).map((w) => ({
        label: w.label,
        value: `${w.activeProjects} projects · ${egp(w.revenue)}`,
        href: `/commercial/${w.slug}`,
      })),
    });
  }

  // Quotation pipeline
  const quoteMetrics = computeQuotationMetrics(snapshot.asOf);
  if (
    quoteMetrics.pendingCount > 0 ||
    quoteMetrics.waitingClientCount > 0 ||
    quoteMetrics.pipelineValue > 0
  ) {
    panels.push({
      key: "quotations",
      title: "Quotation Pipeline",
      description: "Sales pipeline from open quotations.",
      href: "/quotations",
      lines: [
        {
          label: "Pending",
          value: String(quoteMetrics.pendingCount),
          href: "/quotations",
        },
        {
          label: "Waiting client",
          value: String(quoteMetrics.waitingClientCount),
          href: "/quotations",
        },
        {
          label: "Pipeline value",
          value: egp(quoteMetrics.pipelineValue),
          href: "/quotations",
        },
        {
          label: "Won / lost (month)",
          value: `${quoteMetrics.wonThisMonth} / ${quoteMetrics.lostThisMonth}`,
          href: "/quotations",
        },
      ],
    });
  }

  // Today's Deliveries
  const todayDeliveries = snapshot.schedule.deliveries.filter(
    (d) => d.when === "today"
  );
  const upcomingDeliveries = snapshot.schedule.deliveries.slice(0, 4);
  if (todayDeliveries.length > 0 || upcomingDeliveries.length > 0) {
    const source =
      todayDeliveries.length > 0 ? todayDeliveries : upcomingDeliveries;
    panels.push({
      key: "deliveries",
      title: "Today's Deliveries",
      description:
        todayDeliveries.length > 0
          ? "Deliveries due today."
          : "Upcoming deliveries on the radar.",
      href: "/orders",
      lines: source.map((d) => ({
        label: d.clientName,
        value: d.title,
        href: `/orders/${d.id}`,
      })),
    });
  }

  // Recent Payments
  const recentPaid = getPayments()
    .filter((p) => p.status === "paid" && p.paidAt)
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))
    .slice(0, 4);
  if (recentPaid.length > 0) {
    panels.push({
      key: "payments",
      title: "Recent Payments",
      description: "Latest collected payments.",
      href: "/finance",
      lines: recentPaid.map((p) => ({
        label: p.label ?? p.kind,
        value: `${egp(p.amount)} · ${p.paidAt}`,
        href: p.orderId ? `/orders/${p.orderId}` : "/finance",
      })),
    });
  }

  // Crew Activity
  if (snapshot.team.length > 0) {
    panels.push({
      key: "crew",
      title: "Crew Activity",
      description: "Workload from order assignments.",
      href: "/people",
      lines: snapshot.team.slice(0, 4).map((m) => ({
        label: m.name,
        value: `${m.currentWorkload} active · ${m.ordersCompleted} done`,
        href: `/people/${m.id}`,
      })),
    });
  }

  // Revenue Snapshot
  panels.push({
    key: "revenue",
    title: "Revenue Snapshot",
    description: "Booked, collected, and outstanding.",
    href: "/finance",
    lines: [
      { label: "Booked", value: egp(snapshot.financial.revenue), href: "/finance" },
      { label: "Collected", value: egp(snapshot.financial.collected), href: "/finance" },
      { label: "Outstanding", value: egp(snapshot.financial.outstanding), href: "/finance" },
      {
        label: "This month",
        value: egp(snapshot.kpis.revenueThisMonth),
        href: "/finance",
      },
    ],
  });

  // Upcoming Deadlines
  if (snapshot.schedule.deadlines.length > 0) {
    panels.push({
      key: "deadlines",
      title: "Upcoming Deadlines",
      description: "Deadlines in the next window.",
      href: "/calendar",
      lines: snapshot.schedule.deadlines.slice(0, 4).map((d) => ({
        label: d.date,
        value: `${d.clientName} · ${d.title}`,
        href: `/orders/${d.id}`,
      })),
    });
  }

  return panels;
}
