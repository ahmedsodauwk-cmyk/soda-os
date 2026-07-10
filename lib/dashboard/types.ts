import type { OrderStatus } from "@/lib/orders/types";

/** Studio clock for demo-stable schedule / overdue math (matches BUSINESS_TODAY). */
export const DASHBOARD_AS_OF = "2026-07-10";

export interface DashboardKpis {
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueMonthChangePct: number | null;
  outstandingPayments: number;
  activeProjects: number;
  activeOrders: number;
  upcomingShoots: number;
  upcomingDeliveries: number;
  activeClients: number;
}

export interface WorkspacePerformanceRow {
  id: string;
  label: string;
  slug: string;
  color?: string;
  revenue: number;
  activeProjects: number;
  orders: number;
  progress: number;
}

export interface TeamPerformanceRow {
  id: string;
  name: string;
  role: string;
  initials: string;
  projectsAssigned: number;
  ordersCompleted: number;
  currentWorkload: number;
  /** projectsAssigned + currentWorkload — used for “most active” ranking */
  activityScore: number;
}

export interface FinancialOverview {
  /** Booked revenue: sum of non-cancelled order prices */
  revenue: number;
  /** Cash collected: paid payments excluding refunds */
  collected: number;
  outstanding: number;
  deposits: number;
  remainingBalance: number;
}

export interface ScheduleItem {
  id: string;
  title: string;
  clientName: string;
  date: string;
  location: string;
  kind: "shoot" | "delivery" | "deadline";
  status: OrderStatus | string;
  when: "today" | "tomorrow" | "upcoming";
}

export interface UpcomingSchedule {
  asOf: string;
  todayShoots: ScheduleItem[];
  tomorrowShoots: ScheduleItem[];
  deliveries: ScheduleItem[];
  deadlines: ScheduleItem[];
}

export type AttentionSeverity = "critical" | "warning" | "info";

export interface AttentionItem {
  id: string;
  category:
    | "overdue_delivery"
    | "unpaid_client"
    | "unassigned_team"
    | "deadline_soon";
  severity: AttentionSeverity;
  title: string;
  detail: string;
  href?: string;
  /** Optional money figure (e.g. unpaid balance) */
  amount?: number;
}

export interface RecentOrderRow {
  id: string;
  clientName: string;
  projectType: string;
  status: OrderStatus;
  shootDate: string;
  price: number;
}

export interface MonthlyRevenuePoint {
  key: string;
  label: string;
  revenue: number;
}

export interface DashboardSnapshot {
  asOf: string;
  kpis: DashboardKpis;
  workspaces: WorkspacePerformanceRow[];
  team: TeamPerformanceRow[];
  financial: FinancialOverview;
  schedule: UpcomingSchedule;
  attention: AttentionItem[];
  recentOrders: RecentOrderRow[];
  monthlyRevenue: MonthlyRevenuePoint[];
}
