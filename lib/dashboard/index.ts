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
