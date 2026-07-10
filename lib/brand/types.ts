import type { DashboardSnapshot } from "@/lib/dashboard/types";

/** Time-of-day bucket for greetings and brief cards. */
export type DayPeriod = "morning" | "afternoon" | "evening";

/** Business mood derived from existing dashboard numbers (read-only mapping). */
export type BusinessMood =
  | "busy_day"
  | "quiet_day"
  | "great_month"
  | "overdue_heavy"
  | "shoots_ahead"
  | "steady";

export type ModuleSloganKey =
  | "dashboard"
  | "orders"
  | "projects"
  | "clients"
  | "workspaces"
  | "projectHub"
  | "rtm"
  | "weddings"
  | "fashion"
  | "product"
  | "events"
  | "commercial";

export type EmptyStateKey =
  | "orders"
  | "clients"
  | "workspaces"
  | "projects"
  | "files"
  | "shoots"
  | "deliveries"
  | "deadlines"
  | "payments"
  | "team"
  | "attentionClear"
  | "notes"
  | "activity"
  | "deliverables";

export type SuccessKey = "orderCreated" | "clientCreated";

export type WarningKey =
  | "overdueDeliveries"
  | "unpaidBalances"
  | "deadlineSoon"
  | "unassignedTeam";

export type LoadingKey =
  | "default"
  | "dashboard"
  | "orders"
  | "clients"
  | "workspaces"
  | "project";

export type KpiCopyKey =
  | "revenueThisMonth"
  | "revenueLastMonth"
  | "outstanding"
  | "activeProjects"
  | "activeOrders"
  | "upcomingShoots"
  | "upcomingDeliveries"
  | "activeClients";

export type DashboardSectionKey =
  | "quickActions"
  | "kpis"
  | "financial"
  | "attention"
  | "workspaces"
  | "team"
  | "schedule"
  | "recentOrders";

export type HubSectionCopyKey =
  | "overview"
  | "orders"
  | "calendar"
  | "files"
  | "payments"
  | "timeline"
  | "team"
  | "notes"
  | "activity"
  | "deliverables"
  | "upcomingShoots";

export interface EmptyStateCopy {
  title: string;
  description: string;
}

export interface SectionCopy {
  title: string;
  description: string;
}

/** Multi-line hero brief — greeting + hook + insight lines + closer. */
export interface BriefCardCopy {
  period: DayPeriod;
  mood: BusinessMood;
  /** Card eyebrow label (English chrome) */
  label: string;
  /** Large greeting line (Egyptian Arabic + Junior Soda) */
  greeting: string;
  /** Soft follow-up under the greeting */
  hook: string;
  /** Computed teammate lines from live dashboard signals */
  lines: string[];
  /** Closing energy line */
  closer: string;
}

export interface VoiceSignals {
  overdueCount: number;
  unpaidCount: number;
  upcomingShoots: number;
  upcomingDeliveries: number;
  activeOrders: number;
  activeProjects: number;
  revenueMonthChangePct: number | null;
  attentionCritical: number;
  todayShoots: number;
  todayDeliveries: number;
}

export type DashboardVoiceInput = Pick<
  DashboardSnapshot,
  "kpis" | "attention" | "schedule"
>;
