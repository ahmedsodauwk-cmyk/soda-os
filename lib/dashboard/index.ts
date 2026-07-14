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
export { DASHBOARD_AS_OF, getDashboardAsOf } from "@/lib/dashboard/types";
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
export { getDashboardSnapshot, loadDashboardSnapshot } from "@/lib/dashboard/repository";
export {
  loadScopedDashboardSnapshot,
} from "@/lib/dashboard/scoped-snapshot";
export type { ScopedDashboardResult } from "@/lib/dashboard/scoped-snapshot";
export {
  buildActivityFeed,
  getActivityFeedRotateMs,
} from "@/lib/dashboard/activity-feed";
export type {
  ActivityFeedEvent,
  ActivityFeedKind,
} from "@/lib/dashboard/activity-feed";
export {
  buildRotatingSummaries,
  getRotatingSummaryMs,
} from "@/lib/dashboard/rotating-summaries";
export type {
  RotatingSummaryKey,
  RotatingSummaryPanel,
} from "@/lib/dashboard/rotating-summaries";
export {
  HERO_GREETINGS,
  buildHeroOperationalLines,
  getHeroDayPeriod,
  getHeroGreeting,
} from "@/lib/dashboard/hero-summary";
