/**
 * SODA Brain — Founder Intelligence Workspace types.
 * Completely isolated from ERP. Never references clients/orders/finance tables.
 */

export const BRAIN_WORKSPACES = [
  "inbox",
  "money_memory",
  "potential_orders",
  "client_notebook",
  "ideas",
  "reminders",
] as const;

export type BrainWorkspace = (typeof BRAIN_WORKSPACES)[number];

export const MONEY_STATUSES = ["Pending", "Collected", "Cancelled", "Resolved"] as const;
export type MoneyStatus = (typeof MONEY_STATUSES)[number];

export const MONEY_KINDS = ["to_collect", "lent", "debt", "note"] as const;
export type MoneyKind = (typeof MONEY_KINDS)[number];

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

/** Future Promote Engine targets — structure only. */
export const PROMOTE_TARGETS = [
  "order",
  "client",
  "finance_note",
  "calendar",
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
  | "deleted";

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
  /** Future AI — unused now */
  rawText: string | null;
  classificationStatus: ClassificationStatus | null;
  /** Future Promote — unused now */
  promoteTarget: PromoteTarget | null;
  promotedAt: string | null;
  promotedRef: string | null;
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
  rawText?: string | null;
};

export type UpdateBrainEntryInput = Partial<
  Omit<NewBrainEntryInput, "workspace">
> & {
  workspace?: never;
};

export const WORKSPACE_LABELS_EN: Record<BrainWorkspace, string> = {
  inbox: "Inbox",
  money_memory: "Money Memory",
  potential_orders: "Potential Orders",
  client_notebook: "Client Notebook",
  ideas: "Ideas",
  reminders: "Reminders",
};

export const WORKSPACE_LABELS_AR: Record<BrainWorkspace, string> = {
  inbox: "الوارد",
  money_memory: "ذاكرة المال",
  potential_orders: "أوردرات محتملة",
  client_notebook: "دفتر العملاء",
  ideas: "أفكار",
  reminders: "تذكيرات",
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
    default:
      return null;
  }
}
