import type { DashboardSnapshot } from "@/lib/dashboard/types";

/** Time-of-day bucket for greetings and brief cards. */
export type DayPeriod = "morning" | "afternoon" | "evening" | "late_night";

/** Business mood derived from existing dashboard numbers (read-only mapping). */
export type BusinessMood =
  | "busy_day"
  | "quiet_day"
  | "great_month"
  | "overdue_heavy"
  | "shoots_ahead"
  | "steady";

/** Welcome gate mode from last-visit localStorage. */
export type WelcomeMode = "morning_brief" | "welcome_back" | "command_center";

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
  | "commercial"
  | "finance"
  | "quotations"
  | "about"
  | "login"
  | "crew"
  | "crewProfile"
  | "calendar"
  | "statistics"
  | "equipment"
  | "settings"
  | "notifications"
  | "mySpace"
  | "myWallet";

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

/** Command Center widget keys — Experience v1.0 */
export type DashboardSectionKey =
  | "quickActions"
  | "kpis"
  | "financial"
  | "attention"
  | "workspaces"
  | "team"
  | "schedule"
  | "recentOrders"
  | "operations"
  | "projects"
  | "sodaLive"
  | "companyPulse";

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

/** Pulse chip inside the Morning Brief hero (English label, live count). */
export interface BriefSummaryStat {
  key: string;
  label: string;
  value: number;
  /** Soft Arabic whisper under the number */
  whisper: string;
}

/** Top priority callout — attention issue or next schedule item. */
export interface BriefPriority {
  eyebrow: string;
  title: string;
  detail: string;
  href: string;
  ctaLabel: string;
}

export interface BriefAction {
  label: string;
  href: string;
  /** Primary fills the hero CTA; outline is secondary. */
  emphasis: "primary" | "secondary";
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
  /** Today's pulse — real counts from the dashboard snapshot */
  summary: BriefSummaryStat[];
  /** Main priority from attention / schedule */
  priority: BriefPriority | null;
  /** English CTAs to existing routes */
  actions: BriefAction[];
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

/** Company Pulse — health sentences from snapshot (no new math). */
export interface CompanyPulseInsight {
  id: string;
  /** English metric label OK */
  label: string;
  /** Arabic / mixed brand-voice insight */
  insight: string;
  tone: "good" | "watch" | "pressure" | "neutral";
  /** Next logical surface for this insight */
  href?: string;
}

/** SODA LIVE awareness item — never critical ops. */
export type SodaLiveKind =
  | "delivery"
  | "payment"
  | "workspace"
  | "shoot"
  | "achievement"
  | "milestone"
  | "quote"
  | "activity";

export interface SodaLiveItem {
  id: string;
  kind: SodaLiveKind;
  /** English chrome eyebrow */
  eyebrow: string;
  title: string;
  /** Arabic / mixed body */
  body: string;
  /** ISO-ish date for newest-first sort; null = evergreen (quotes) */
  at: string | null;
  href?: string;
}
