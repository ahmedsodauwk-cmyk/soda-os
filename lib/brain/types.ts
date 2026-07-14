/**
 * SODA Brain — Founder Intelligence Workspace types (Mission 05.1).
 * Completely isolated from ERP. Never references clients/orders/finance FKs.
 */

export const BRAIN_WORKSPACES = [
  "inbox",
  "money_memory",
  "potential_orders",
  "client_notebook",
  "ideas",
  "reminders",
  "personal_decisions",
  "meeting_notes",
  "future_plans",
  "archive",
] as const;

export type BrainWorkspace = (typeof BRAIN_WORKSPACES)[number];

export const MONEY_STATUSES = [
  "Pending",
  "Collected",
  "Cancelled",
  "Resolved",
] as const;
export type MoneyStatus = (typeof MONEY_STATUSES)[number];

export const MONEY_KINDS = [
  "to_collect",
  "lent",
  "debt",
  "crew_advance",
  "client_debt",
  "note",
] as const;
export type MoneyKind = (typeof MONEY_KINDS)[number];

export const MONEY_DIRECTIONS = ["in", "out", "neutral"] as const;
export type MoneyDirection = (typeof MONEY_DIRECTIONS)[number];

export const CURRENCIES = ["EGP", "USD", "EUR", "SAR", "AED"] as const;
export type BrainCurrency = (typeof CURRENCIES)[number];

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type BrainPriority = (typeof PRIORITIES)[number];

export const POTENTIAL_ORDER_STATUSES = [
  "Thinking",
  "Negotiating",
  "Likely",
  "Cancelled",
  "Confirmed",
] as const;
export type PotentialOrderStatus = (typeof POTENTIAL_ORDER_STATUSES)[number];

export const REMINDER_STATUSES = ["Open", "Done", "Cancelled"] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export const DECISION_STATUSES = [
  "Open",
  "Decided",
  "Deferred",
  "Cancelled",
] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const PLAN_STATUSES = ["Idea", "Active", "Paused", "Done"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

/** Future Promote Engine targets — structure only. */
export const PROMOTE_TARGETS = [
  "order",
  "client",
  "reminder",
  "calendar",
  "finance_note",
  "none",
] as const;
export type PromoteTarget = (typeof PROMOTE_TARGETS)[number];

export const CLASSIFICATION_STATUSES = [
  "pending",
  "classified",
  "skipped",
] as const;
export type ClassificationStatus = (typeof CLASSIFICATION_STATUSES)[number];

export type BrainHistoryAction =
  | "created"
  | "updated"
  | "status_changed"
  | "archived"
  | "deleted";

export const QUICK_AMOUNTS = [
  100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000,
] as const;

export type BrainEntry = {
  id: string;
  workspace: BrainWorkspace;
  title: string | null;
  body: string;
  status: string | null;
  confidence: number | null;
  clientLabel: string | null;
  moneyKind: MoneyKind | null;
  amountNote: string | null;
  dueAt: string | null;
  tags: string[];
  /** Free-form JSON mission payload — never ERP FK */
  structuredData: Record<string, unknown>;
  currency: BrainCurrency | null;
  amount: number | null;
  moneyDirection: MoneyDirection | null;
  priority: BrainPriority | null;
  personLabel: string | null;
  companyLabel: string | null;
  phone: string | null;
  budgetNote: string | null;
  reminderEnabled: boolean;
  /** Future AI — heuristic may set raw_text / classification now */
  rawText: string | null;
  classificationStatus: ClassificationStatus | null;
  classification: string | null;
  classificationConfidence: number | null;
  futureAiSummary: string | null;
  /** Future Promote — unused now */
  promoteTarget: PromoteTarget | null;
  promotedAt: string | null;
  promotedRef: string | null;
  archivedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BrainHistoryRow = {
  id: string;
  entryId: string;
  changedAt: string;
  changedBy: string | null;
  action: BrainHistoryAction;
  snapshot: Record<string, unknown>;
  note: string | null;
};

export type BrainChatRole = "user" | "assistant" | "system";

export type BrainChatMessage = {
  id: string;
  role: BrainChatRole;
  content: string;
  classifiedWorkspace: BrainWorkspace | null;
  entryId: string | null;
  heuristicMeta: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
};

export type NewBrainEntryInput = {
  workspace: BrainWorkspace;
  title?: string | null;
  body?: string;
  status?: string | null;
  confidence?: number | null;
  clientLabel?: string | null;
  moneyKind?: MoneyKind | null;
  amountNote?: string | null;
  dueAt?: string | null;
  tags?: string[];
  structuredData?: Record<string, unknown>;
  currency?: BrainCurrency | null;
  amount?: number | null;
  moneyDirection?: MoneyDirection | null;
  priority?: BrainPriority | null;
  personLabel?: string | null;
  companyLabel?: string | null;
  phone?: string | null;
  budgetNote?: string | null;
  reminderEnabled?: boolean;
  rawText?: string | null;
  classification?: string | null;
  classificationConfidence?: number | null;
  classificationStatus?: ClassificationStatus | null;
};

export type UpdateBrainEntryInput = Partial<
  Omit<NewBrainEntryInput, "workspace">
> & {
  workspace?: BrainWorkspace;
  archivedAt?: string | null;
};

export type MoneyDashboard = {
  moneyWaiting: number;
  loansGiven: number;
  loansTaken: number;
  crewAdvances: number;
  clientDebts: number;
  upcomingCollections: number;
  totalWaiting: number;
  currency: BrainCurrency;
  recentActivity: BrainEntry[];
  counts: {
    waiting: number;
    loansGiven: number;
    loansTaken: number;
    crewAdvances: number;
    clientDebts: number;
    upcoming: number;
  };
};

export type BrainErpReadonlySummary = {
  asOf: string;
  todayOrders: Array<{
    id: string;
    clientName: string;
    status: string;
    shootDate: string;
  }>;
  upcomingShoots: Array<{
    id: string;
    title: string;
    clientName: string;
    date: string;
  }>;
  revenueSummary: {
    revenueThisMonth: number;
    outstanding: number;
    collected: number;
  };
  crewWorkingToday: Array<{ name: string; role: string; workload: number }>;
  calendarSummary: {
    todayShoots: number;
    tomorrowShoots: number;
    deliveries: number;
    deadlines: number;
  };
};

export const WORKSPACE_LABELS_EN: Record<BrainWorkspace, string> = {
  inbox: "Inbox",
  money_memory: "Money Memory",
  potential_orders: "Potential Orders",
  client_notebook: "Client Notebook",
  ideas: "Ideas",
  reminders: "Reminders",
  personal_decisions: "Personal Decisions",
  meeting_notes: "Meeting Notes",
  future_plans: "Future Plans",
  archive: "Archive",
};

export const WORKSPACE_LABELS_AR: Record<BrainWorkspace, string> = {
  inbox: "الوارد",
  money_memory: "ذاكرة المال",
  potential_orders: "أوردرات محتملة",
  client_notebook: "دفتر العملاء",
  ideas: "أفكار",
  reminders: "تذكيرات",
  personal_decisions: "قرارات شخصية",
  meeting_notes: "ملاحظات اجتماعات",
  future_plans: "خطط مستقبلية",
  archive: "الأرشيف",
};

export const MONEY_KIND_LABELS_EN: Record<MoneyKind, string> = {
  to_collect: "To collect",
  lent: "Loan given",
  debt: "Loan taken",
  crew_advance: "Crew advance",
  client_debt: "Client debt",
  note: "Note",
};

export function defaultStatusForWorkspace(
  workspace: BrainWorkspace
): string | null {
  switch (workspace) {
    case "money_memory":
      return "Pending";
    case "potential_orders":
      return "Thinking";
    case "reminders":
      return "Open";
    case "personal_decisions":
      return "Open";
    case "future_plans":
      return "Idea";
    case "archive":
      return "Archived";
    default:
      return null;
  }
}

export function statusesForWorkspace(
  workspace: BrainWorkspace
): readonly string[] | null {
  switch (workspace) {
    case "money_memory":
      return MONEY_STATUSES;
    case "potential_orders":
      return POTENTIAL_ORDER_STATUSES;
    case "reminders":
      return REMINDER_STATUSES;
    case "personal_decisions":
      return DECISION_STATUSES;
    case "future_plans":
      return PLAN_STATUSES;
    default:
      return null;
  }
}
