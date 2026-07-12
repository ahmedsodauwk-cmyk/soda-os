import { computeClientStats } from "@/lib/business/client-stats";
import { getBusinessToday } from "@/lib/business/types";
import { computeWorkspaceStats } from "@/lib/business/workspace-stats";
import { averageProgress } from "@/lib/projects/utils";
import type { Client } from "@/lib/clients/types";
import type { Order, OrderStatus } from "@/lib/orders/types";
import type { Payment } from "@/lib/payments/types";
import type { Project, ProjectTeamMember } from "@/lib/projects/types";
import type { WorkspaceSummary } from "@/lib/workspaces/types";
import {
  getDashboardAsOf,
  type AttentionItem,
  type DashboardKpis,
  type DashboardSnapshot,
  type FinancialOverview,
  type MonthlyRevenuePoint,
  type RecentOrderRow,
  type ScheduleItem,
  type TeamPerformanceRow,
  type UpcomingSchedule,
  type WorkspacePerformanceRow,
} from "@/lib/dashboard/types";
import {
  isOrderActiveWorkload,
  isOrderBillable,
  isOrderCompleted,
  isOrderInPipeline,
} from "@/lib/orders/status";

const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  "Confirmed",
  "Scheduled",
  "Shooting",
  "Editing",
]);

const PIPELINE_ORDER_STATUSES = new Set<OrderStatus>([
  "Holding",
  "Confirmed",
  "Pending",
  "Scheduled",
  "Shooting",
  "Editing",
]);

/** Days ahead for “close to deadline” attention. */
const DEADLINE_SOON_DAYS = 14;

function monthKeyFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function shiftMonthKey(yyyyMm: string, delta: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

function isBillable(order: Order): boolean {
  return isOrderBillable(order.status);
}

function isActiveProject(project: Project): boolean {
  return (
    project.isActive &&
    (project.status === "Active" || project.status === "OnHold")
  );
}

function paidAmount(payments: Payment[]): number {
  return payments
    .filter((p) => p.status === "paid" && p.kind !== "refund")
    .reduce((acc, p) => acc + p.amount, 0);
}

function refundAmount(payments: Payment[]): number {
  return payments
    .filter((p) => p.status === "paid" && p.kind === "refund")
    .reduce((acc, p) => acc + p.amount, 0);
}

function cashCollectedInMonth(
  payments: Payment[],
  monthKey: string
): number {
  return payments
    .filter(
      (p) =>
        p.status === "paid" &&
        p.kind !== "refund" &&
        p.paidAt &&
        monthKeyFromDate(p.paidAt) === monthKey
    )
    .reduce((acc, p) => acc + p.amount, 0);
}

function orderOutstanding(order: Order, payments: Payment[]): number {
  if (!isBillable(order)) return 0;
  const related = payments.filter((p) => p.orderId === order.id);
  return Math.max(0, order.price - paidAmount(related) + refundAmount(related));
}

export function computeDashboardKpis(
  projects: Project[],
  orders: Order[],
  clients: Client[],
  payments: Payment[],
  asOf: string = getDashboardAsOf()
): DashboardKpis {
  const thisMonth = monthKeyFromDate(asOf);
  const lastMonth = shiftMonthKey(thisMonth, -1);

  const revenueThisMonth = cashCollectedInMonth(payments, thisMonth);
  const revenueLastMonth = cashCollectedInMonth(payments, lastMonth);

  let revenueMonthChangePct: number | null = null;
  if (revenueLastMonth > 0) {
    revenueMonthChangePct = Math.round(
      ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
    );
  } else if (revenueThisMonth > 0) {
    revenueMonthChangePct = 100;
  }

  const outstandingPayments = orders.reduce(
    (acc, o) => acc + orderOutstanding(o, payments),
    0
  );

  const activeProjects = projects.filter(isActiveProject).length;
  const activeOrders = orders.filter((o) =>
    ACTIVE_ORDER_STATUSES.has(o.status)
  ).length;

  const upcomingShoots = orders.filter(
    (o) =>
      PIPELINE_ORDER_STATUSES.has(o.status) && o.shootDate >= asOf
  ).length;

  const upcomingDeliveries = orders.filter(
    (o) =>
      PIPELINE_ORDER_STATUSES.has(o.status) && o.deliveryDate >= asOf
  ).length;

  const activeClientIds = new Set<string>();
  for (const project of projects.filter(isActiveProject)) {
    if (project.clientId) activeClientIds.add(project.clientId);
  }
  for (const client of clients.filter((c) => c.isActive)) {
    const stats = computeClientStats(client.id, projects, orders, payments);
    if (stats.activeProjects > 0 || stats.outstandingBalance > 0) {
      activeClientIds.add(client.id);
    }
  }

  return {
    revenueThisMonth,
    revenueLastMonth,
    revenueMonthChangePct,
    outstandingPayments,
    activeProjects,
    activeOrders,
    upcomingShoots,
    upcomingDeliveries,
    activeClients: activeClientIds.size,
  };
}

export function computeWorkspacePerformance(
  workspaceSummaries: WorkspaceSummary[],
  projects: Project[],
  orders: Order[]
): WorkspacePerformanceRow[] {
  return workspaceSummaries
    .map((ws) => {
      const wsProjects = projects.filter(
        (p) => p.workspaceId === ws.id && p.isActive
      );
      const stats = computeWorkspaceStats(ws.id, projects, orders);
      const activeProjects = wsProjects.filter(isActiveProject).length;

      return {
        id: ws.id,
        label: ws.label,
        slug: ws.slug,
        color: ws.color,
        revenue: stats.revenue,
        activeProjects,
        orders: stats.activeOrders,
        progress: averageProgress(wsProjects),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function computeTeamPerformance(
  projects: Project[],
  orders: Order[]
): TeamPerformanceRow[] {
  const byMember = new Map<
    string,
    {
      member: ProjectTeamMember;
      projectIds: Set<string>;
      completedOrderIds: Set<string>;
      workloadOrderIds: Set<string>;
    }
  >();

  for (const project of projects.filter((p) => p.isActive)) {
    const projectOrders = orders.filter((o) => o.projectId === project.id);
    for (const member of project.team ?? []) {
      let entry = byMember.get(member.id);
      if (!entry) {
        entry = {
          member,
          projectIds: new Set(),
          completedOrderIds: new Set(),
          workloadOrderIds: new Set(),
        };
        byMember.set(member.id, entry);
      }

      if (isActiveProject(project)) {
        entry.projectIds.add(project.id);
      }

      for (const order of projectOrders) {
        if (isOrderCompleted(order.status)) {
          entry.completedOrderIds.add(order.id);
        } else if (
          ACTIVE_ORDER_STATUSES.has(order.status) ||
          isOrderActiveWorkload(order.status)
        ) {
          entry.workloadOrderIds.add(order.id);
        }
      }
    }
  }

  return [...byMember.values()]
    .map(({ member, projectIds, completedOrderIds, workloadOrderIds }) => {
      const projectsAssigned = projectIds.size;
      const ordersCompleted = completedOrderIds.size;
      const currentWorkload = workloadOrderIds.size;
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        initials: member.initials,
        projectsAssigned,
        ordersCompleted,
        currentWorkload,
        activityScore: projectsAssigned * 2 + currentWorkload + ordersCompleted,
      };
    })
    .sort((a, b) => b.activityScore - a.activityScore);
}

export function computeFinancialOverview(
  orders: Order[],
  payments: Payment[]
): FinancialOverview {
  const billable = orders.filter(isBillable);
  const booked = billable.reduce((acc, o) => acc + o.price, 0);
  /** Revenue = collected money ONLY */
  const collected = Math.max(0, paidAmount(payments) - refundAmount(payments));
  const outstanding = billable.reduce(
    (acc, o) => acc + orderOutstanding(o, payments),
    0
  );
  const deposits = payments
    .filter((p) => p.kind === "deposit" && p.status === "paid")
    .reduce((acc, p) => acc + p.amount, 0);

  return {
    revenue: collected,
    collected,
    outstanding,
    deposits,
    remainingBalance: outstanding,
    booked,
  };
}

export function computeUpcomingSchedule(
  orders: Order[],
  asOf: string = getDashboardAsOf()
): UpcomingSchedule {
  const tomorrow = addDays(asOf, 1);

  const toShootItem = (order: Order, when: ScheduleItem["when"]): ScheduleItem => ({
    id: `shoot-${order.id}`,
    orderId: order.id,
    title: `${order.projectType} shoot`,
    clientName: order.clientName,
    date: order.shootDate,
    location: order.location,
    kind: "shoot",
    status: order.status,
    when,
    href: `/orders/${order.id}`,
  });

  const pipeline = orders.filter(
    (o) =>
      PIPELINE_ORDER_STATUSES.has(o.status) || isOrderInPipeline(o.status)
  );

  const todayShoots = pipeline
    .filter((o) => o.shootDate === asOf)
    .map((o) => toShootItem(o, "today"));

  const tomorrowShoots = pipeline
    .filter((o) => o.shootDate === tomorrow)
    .map((o) => toShootItem(o, "tomorrow"));

  const deliveries = pipeline
    .filter((o) => o.deliveryDate >= asOf)
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))
    .slice(0, 6)
    .map(
      (o): ScheduleItem => ({
        id: `delivery-${o.id}`,
        orderId: o.id,
        title: `${o.projectType} delivery`,
        clientName: o.clientName,
        date: o.deliveryDate,
        location: o.location,
        kind: "delivery",
        status: o.status,
        when:
          o.deliveryDate === asOf
            ? "today"
            : o.deliveryDate === tomorrow
              ? "tomorrow"
              : "upcoming",
        href: `/orders/${o.id}`,
      })
    );

  const deadlineHorizon = addDays(asOf, DEADLINE_SOON_DAYS);
  const deadlines = pipeline
    .filter(
      (o) => o.deliveryDate >= asOf && o.deliveryDate <= deadlineHorizon
    )
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))
    .slice(0, 6)
    .map(
      (o): ScheduleItem => ({
        id: `deadline-${o.id}`,
        orderId: o.id,
        title: `${o.clientName} — due`,
        clientName: o.clientName,
        date: o.deliveryDate,
        location: o.location,
        kind: "deadline",
        status: o.status,
        when:
          o.deliveryDate === asOf
            ? "today"
            : o.deliveryDate === tomorrow
              ? "tomorrow"
              : "upcoming",
        href: `/orders/${o.id}`,
      })
    );

  return {
    asOf,
    todayShoots,
    tomorrowShoots,
    deliveries,
    deadlines,
  };
}

export function computeAttentionItems(
  projects: Project[],
  orders: Order[],
  clients: Client[],
  payments: Payment[],
  asOf: string = getDashboardAsOf()
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const horizon = addDays(asOf, DEADLINE_SOON_DAYS);

  for (const order of orders) {
    if (
      PIPELINE_ORDER_STATUSES.has(order.status) &&
      order.deliveryDate < asOf
    ) {
      items.push({
        id: `overdue-${order.id}`,
        category: "overdue_delivery",
        severity: "critical",
        title: `Overdue delivery — ${order.clientName}`,
        detail: `${order.projectType} · due ${order.deliveryDate} · ${order.status}`,
        href: `/orders/${order.id}`,
      });
    }
  }

  for (const client of clients.filter((c) => c.isActive)) {
    const stats = computeClientStats(client.id, projects, orders, payments);
    if (stats.outstandingBalance <= 0) continue;

    const clientOrders = orders.filter(
      (o) =>
        o.clientId === client.id ||
        (o.projectId &&
          projects.some(
            (p) => p.id === o.projectId && p.clientId === client.id
          ))
    );
    const hasOverdue = clientOrders.some((o) => {
      if (o.status === "Cancelled") return false;
      const due = o.deliveryDate || o.shootDate;
      if (!due || due >= asOf) return false;
      return orderOutstanding(o, payments) > 0;
    });

    if (hasOverdue) {
      items.push({
        id: `unpaid-${client.id}`,
        category: "unpaid_client",
        severity: "warning",
        title: `Unpaid — ${client.name}`,
        detail: `Outstanding on ${stats.totalOrders} order(s)`,
        href: `/clients/${client.id}`,
        amount: stats.outstandingBalance,
      });
    } else {
      items.push({
        id: `waiting-${client.id}`,
        category: "waiting_payment",
        severity: "info",
        title: `Waiting Payment — ${client.name}`,
        detail: `Outstanding before due · ${stats.totalOrders} order(s)`,
        href: `/clients/${client.id}`,
        amount: stats.outstandingBalance,
      });
    }
  }

  for (const project of projects.filter(isActiveProject)) {
    const projectOrders = orders.filter((o) => o.projectId === project.id);
    const hasCrew =
      (project.team && project.team.length > 0) ||
      projectOrders.some(
        (o) => (o.squadMemberIds?.length ?? 0) > 0 || Boolean(o.team?.trim())
      );
    if (hasCrew) continue;
    items.push({
      id: `unassigned-${project.id}`,
      category: "unassigned_team",
      severity: "warning",
      title: `No team — ${project.name}`,
      detail: `${project.clientName} · ${project.status}`,
      href: `/projects/${project.id}`,
    });
  }

  for (const order of orders) {
    if (
      PIPELINE_ORDER_STATUSES.has(order.status) &&
      order.deliveryDate >= asOf &&
      order.deliveryDate <= horizon
    ) {
      const project = projects.find((p) => p.id === order.projectId);
      items.push({
        id: `deadline-${order.id}`,
        category: "deadline_soon",
        severity: "info",
        title: `Deadline soon — ${order.clientName}`,
        detail: `${project?.name ?? order.projectType} · due ${order.deliveryDate}`,
        href: `/orders/${order.id}`,
      });
    }
  }

  const severityRank: Record<AttentionItem["severity"], number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return items.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity]
  );
}

export function computeRecentOrders(orders: Order[], limit = 6): RecentOrderRow[] {
  return [...orders]
    .sort((a, b) => b.shootDate.localeCompare(a.shootDate))
    .slice(0, limit)
    .map((o) => ({
      id: o.id,
      clientName: o.clientName,
      projectType: o.projectType,
      status: o.status,
      shootDate: o.shootDate,
      price: o.price,
    }));
}

export function computeMonthlyRevenueSeries(
  payments: Payment[],
  asOf: string = getDashboardAsOf(),
  months = 6
): MonthlyRevenuePoint[] {
  const end = monthKeyFromDate(asOf);
  const points: MonthlyRevenuePoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const key = shiftMonthKey(end, -i);
    points.push({
      key,
      label: monthLabel(key),
      revenue: cashCollectedInMonth(payments, key),
    });
  }

  return points;
}

export function buildDashboardSnapshot(input: {
  projects: Project[];
  orders: Order[];
  clients: Client[];
  payments: Payment[];
  workspaceSummaries: WorkspaceSummary[];
  asOf?: string;
}): DashboardSnapshot {
  const asOf = input.asOf ?? getBusinessToday();
  const { projects, orders, clients, payments, workspaceSummaries } = input;

  return {
    asOf,
    kpis: computeDashboardKpis(projects, orders, clients, payments, asOf),
    workspaces: computeWorkspacePerformance(
      workspaceSummaries,
      projects,
      orders
    ),
    team: computeTeamPerformance(projects, orders),
    financial: computeFinancialOverview(orders, payments),
    schedule: computeUpcomingSchedule(orders, asOf),
    attention: computeAttentionItems(
      projects,
      orders,
      clients,
      payments,
      asOf
    ),
    recentOrders: computeRecentOrders(orders),
    monthlyRevenue: computeMonthlyRevenueSeries(payments, asOf),
  };
}
