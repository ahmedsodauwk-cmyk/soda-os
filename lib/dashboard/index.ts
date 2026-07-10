export type {
  AttentionItem,
  AttentionSeverity,
  DashboardKpis,
  DashboardSnapshot,
  FinancialOverview,
  MonthlyRevenuePoint,
  RecentOrderRow,
  ScheduleItem,
  TeamPerformanceRow,
  UpcomingSchedule,
  WorkspacePerformanceRow,
} from "@/lib/dashboard/types";
export { DASHBOARD_AS_OF } from "@/lib/dashboard/types";
export {
  buildDashboardSnapshot,
  computeAttentionItems,
  computeDashboardKpis,
  computeFinancialOverview,
  computeMonthlyRevenueSeries,
  computeRecentOrders,
  computeTeamPerformance,
  computeUpcomingSchedule,
  computeWorkspacePerformance,
} from "@/lib/dashboard/stats";
export { getDashboardSnapshot } from "@/lib/dashboard/repository";
