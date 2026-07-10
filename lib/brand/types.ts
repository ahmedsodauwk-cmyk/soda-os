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
  | "payments"
  | "team"
  | "attentionClear";

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

export interface EmptyStateCopy {
  title: string;
  description: string;
}

export interface BriefCardCopy {
  period: DayPeriod;
  /** Card eyebrow label (English chrome) */
  label: string;
  greeting: string;
  body: string;
  insight?: string;
}

export interface VoiceSignals {
  overdueCount: number;
  unpaidCount: number;
  upcomingShoots: number;
  activeOrders: number;
  activeProjects: number;
  revenueMonthChangePct: number | null;
  attentionCritical: number;
  todayShoots: number;
}

export type DashboardVoiceInput = Pick<
  DashboardSnapshot,
  "kpis" | "attention" | "schedule"
>;
