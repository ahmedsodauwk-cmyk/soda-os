/**
 * SODA Brain Intelligence Layer types (Mission 05.2 → Operations Desk 05.3).
 * Local heuristics only — no external AI API. Never writes ERP from parse/think.
 */

import type {
  BrainCurrency,
  BrainEntry,
  BrainPriority,
  BrainWorkspace,
  MoneyDirection,
  MoneyKind,
} from "@/lib/brain/types";

/** High-level Founder intent (heuristic — same shape for future AI). */
export const OPS_INTENTS = [
  "money_memory",
  "potential_order",
  "create_client",
  "create_order",
  "reminder",
  "idea",
  "client_note",
  "meeting_note",
  "decision",
  "future_plan",
  "general_note",
] as const;

export type OpsIntent = (typeof OPS_INTENTS)[number];

/** Draft lifecycle — official only after Approve / Execute. */
export const DRAFT_LIFECYCLE = [
  "draft",
  "approved",
  "executed",
  "cancelled",
] as const;

export type DraftLifecycle = (typeof DRAFT_LIFECYCLE)[number];

/**
 * Where Execute writes after Founder approval.
 * brain_* → Brain tables only. erp_* → existing ERP actions only.
 */
export type ExecuteTarget =
  | "brain_save"
  | "erp_create_client"
  | "erp_create_order";

export type OpsEntityKind =
  | "money"
  | "client"
  | "person"
  | "company"
  | "date"
  | "task"
  | "deadline"
  | "order_ref"
  | "phone"
  | "amount";

export type OpsEntity = {
  kind: OpsEntityKind;
  label: string;
  value?: string | number | null;
};

export type PotentialAction = {
  id: ExecuteTarget;
  labelAr: string;
  labelEn: string;
  /** Soft proposal only — never auto-run. */
  recommended: boolean;
};

export type ErpAwarenessHit = {
  clientId: string;
  clientName: string;
  projectsCount: number;
  ordersCount: number;
  outstandingHint: number | null;
  noteAr: string;
  noteEn: string;
};

/** Editable structured understanding before Founder Approve / Execute. */
export type BrainUnderstanding = {
  rawText: string;
  workspace: BrainWorkspace;
  /** 0–1 */
  confidence: number;
  intent: OpsIntent;
  /** Always starts DRAFT until Approve. */
  lifecycle: DraftLifecycle;
  moneyKind: MoneyKind | null;
  moneyDirection: MoneyDirection | null;
  amount: number | null;
  currency: BrainCurrency | null;
  personLabel: string | null;
  companyLabel: string | null;
  clientLabel: string | null;
  phone: string | null;
  title: string | null;
  status: string | null;
  priority: BrainPriority | null;
  budgetNote: string | null;
  dueAt: string | null;
  /** Shoot / event date when create_order intent. */
  shootDate: string | null;
  projectType: string | null;
  reminderEnabled: boolean;
  reasons: string[];
  entities: OpsEntity[];
  missingFields: string[];
  /** ONE question at a time — human pace. */
  nextQuestionAr: string | null;
  nextQuestionEn: string | null;
  questionsAsked: string[];
  potentialActions: PotentialAction[];
  executeTarget: ExecuteTarget;
  /** True when required fields for intent + executeTarget are present. */
  canApprove: boolean;
  erpAwareness: ErpAwarenessHit[];
  /** Natural confirmation from Intelligence Layer (AR-first). */
  founderSummaryAr: string;
  founderSummaryEn: string;
  /** Voice stub — future speech layer. */
  voice: {
    enabled: false;
    mode: "stub";
    transcript: string | null;
  };
  /** Future AI provider slot — currently heuristic only. */
  intelligenceProvider: "heuristic";
};

export type RelatedMemory = {
  entry: BrainEntry;
  score: number;
  matchReasons: string[];
  /** Soft suggestion for Founder — never auto-applied. */
  suggestionAr: string | null;
  suggestionEn: string | null;
};

export type EntityTimelineEvent = {
  entryId: string;
  at: string;
  workspace: BrainWorkspace;
  title: string | null;
  amount: number | null;
  status: string | null;
  snippet: string;
};

export type EntityTimeline = {
  label: string;
  labelKind: "person" | "company" | "client";
  events: EntityTimelineEvent[];
  /** Soft rollups for money — Founder must confirm any change. */
  moneyOutstandingHint: number | null;
};

export type IntelligenceParseResult = {
  understanding: BrainUnderstanding;
  related: RelatedMemory[];
  timelines: EntityTimeline[];
  suggestions: string[];
};

/** Patch Founder may apply in Understanding Panel before Approve. */
export type UnderstandingEdits = Partial<{
  workspace: BrainWorkspace;
  intent: OpsIntent;
  moneyKind: MoneyKind | null;
  moneyDirection: MoneyDirection | null;
  amount: number | null;
  currency: BrainCurrency | null;
  personLabel: string | null;
  companyLabel: string | null;
  clientLabel: string | null;
  phone: string | null;
  title: string | null;
  status: string | null;
  priority: BrainPriority | null;
  budgetNote: string | null;
  dueAt: string | null;
  shootDate: string | null;
  projectType: string | null;
  reminderEnabled: boolean;
  executeTarget: ExecuteTarget;
  lifecycle: DraftLifecycle;
}>;
