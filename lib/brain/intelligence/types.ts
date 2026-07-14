/**
 * SODA Brain Intelligence Layer types (Mission 05.2).
 * Local heuristics only — no external AI API. Never writes ERP.
 */

import type {
  BrainCurrency,
  BrainEntry,
  BrainPriority,
  BrainWorkspace,
  MoneyDirection,
  MoneyKind,
} from "@/lib/brain/types";

/** Editable structured understanding before Founder Save. */
export type BrainUnderstanding = {
  rawText: string;
  workspace: BrainWorkspace;
  /** 0–1 */
  confidence: number;
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
  reminderEnabled: boolean;
  reasons: string[];
  /** Natural confirmation from Intelligence Layer (AR-first). */
  founderSummaryAr: string;
  founderSummaryEn: string;
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

/** Patch Founder may apply in Understanding Panel before Save. */
export type UnderstandingEdits = Partial<{
  workspace: BrainWorkspace;
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
  reminderEnabled: boolean;
}>;
