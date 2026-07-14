/**
 * Intent + entities enrichment for Operations Desk.
 * Heuristic only — same interface reserved for future local AI / OpenAI.
 */

import type { BrainWorkspace } from "@/lib/brain/types";
import type {
  BrainUnderstanding,
  OpsEntity,
  OpsIntent,
} from "@/lib/brain/intelligence/types";
import {
  buildPotentialActions,
  canApproveDraft,
  computeMissingFields,
  defaultExecuteTarget,
  nextSmartQuestion,
} from "@/lib/brain/intelligence/questions";

export function workspaceToIntent(workspace: BrainWorkspace): OpsIntent {
  switch (workspace) {
    case "money_memory":
      return "money_memory";
    case "potential_orders":
      return "potential_order";
    case "client_notebook":
      return "client_note";
    case "reminders":
      return "reminder";
    case "ideas":
      return "idea";
    case "meeting_notes":
      return "meeting_note";
    case "personal_decisions":
      return "decision";
    case "future_plans":
      return "future_plan";
    default:
      return "general_note";
  }
}

/** Detect explicit ERP create phrasing on top of workspace classification. */
export function detectExplicitErpIntent(text: string): OpsIntent | null {
  const lower = text.toLowerCase();
  if (
    /ضيف\s*عميل|عميل\s*جديد|انشئ\s*عميل|أنشئ\s*عميل|create\s+client|new\s+client|add\s+client/.test(
      lower
    )
  ) {
    return "create_client";
  }
  if (
    /اعمل\s*اوردر|اعمل\s*أوردر|اوردر\s*جديد|أوردر\s*جديد|انشئ\s*اوردر|أنشئ\s*أوردر|create\s+order|new\s+order|book\s+order/.test(
      lower
    )
  ) {
    return "create_order";
  }
  return null;
}

export function intentToWorkspace(intent: OpsIntent): BrainWorkspace {
  switch (intent) {
    case "money_memory":
      return "money_memory";
    case "potential_order":
    case "create_order":
      return "potential_orders";
    case "create_client":
    case "client_note":
      return "client_notebook";
    case "reminder":
      return "reminders";
    case "idea":
      return "ideas";
    case "meeting_note":
      return "meeting_notes";
    case "decision":
      return "personal_decisions";
    case "future_plan":
      return "future_plans";
    default:
      return "inbox";
  }
}

function extractDateHint(text: string): string | null {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  const lower = text.toLowerCase();
  if (/بكرة|tomorrow/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (/النهارده|today/.test(lower)) {
    return new Date().toISOString().slice(0, 10);
  }

  const arNumeric = text.match(
    /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})\b/
  );
  if (arNumeric) {
    const day = arNumeric[1].padStart(2, "0");
    const month = arNumeric[2].padStart(2, "0");
    return `${arNumeric[3]}-${month}-${day}`;
  }
  return null;
}

function extractProjectType(text: string): string | null {
  const lower = text.toLowerCase();
  if (/wedding|فرح|جوز|زواج/.test(lower)) return "Wedding";
  if (/engagement|خطوبة/.test(lower)) return "Engagement";
  if (/commercial|اعلان|إعلان|براند|brand/.test(lower)) return "Commercial";
  if (/event|حدث|فعالية/.test(lower)) return "Event";
  if (/portrait|بورتريه/.test(lower)) return "Portrait";
  if (/product|منتج/.test(lower)) return "Product";
  return null;
}

export function buildEntities(u: {
  amount: number | null;
  currency: string | null;
  personLabel: string | null;
  companyLabel: string | null;
  clientLabel: string | null;
  phone: string | null;
  dueAt: string | null;
  shootDate: string | null;
  moneyKind: string | null;
  title: string | null;
}): OpsEntity[] {
  const entities: OpsEntity[] = [];
  if (u.amount != null) {
    entities.push({
      kind: "amount",
      label: String(u.amount),
      value: u.amount,
    });
    if (u.currency) {
      entities.push({ kind: "money", label: u.currency, value: u.currency });
    }
  }
  if (u.personLabel) {
    entities.push({ kind: "person", label: u.personLabel });
  }
  if (u.companyLabel) {
    entities.push({ kind: "company", label: u.companyLabel });
  }
  if (u.clientLabel) {
    entities.push({ kind: "client", label: u.clientLabel });
  }
  if (u.phone) {
    entities.push({ kind: "phone", label: u.phone, value: u.phone });
  }
  if (u.dueAt) {
    entities.push({ kind: "deadline", label: u.dueAt, value: u.dueAt });
  }
  if (u.shootDate) {
    entities.push({ kind: "date", label: u.shootDate, value: u.shootDate });
  }
  if (u.moneyKind) {
    entities.push({ kind: "money", label: u.moneyKind });
  }
  if (u.title) {
    entities.push({ kind: "task", label: u.title });
  }
  return entities;
}

/**
 * Enrich a base parse result with Operations Desk fields
 * (intent, questions, canApprove, potential actions).
 */
export function enrichOperationsUnderstanding(
  base: Omit<
    BrainUnderstanding,
    | "intent"
    | "lifecycle"
    | "entities"
    | "missingFields"
    | "nextQuestionAr"
    | "nextQuestionEn"
    | "questionsAsked"
    | "potentialActions"
    | "executeTarget"
    | "canApprove"
    | "erpAwareness"
    | "voice"
    | "intelligenceProvider"
    | "shootDate"
    | "projectType"
  > &
    Partial<
      Pick<
        BrainUnderstanding,
        | "intent"
        | "lifecycle"
        | "entities"
        | "missingFields"
        | "nextQuestionAr"
        | "nextQuestionEn"
        | "questionsAsked"
        | "potentialActions"
        | "executeTarget"
        | "canApprove"
        | "erpAwareness"
        | "shootDate"
        | "projectType"
      >
    >
): BrainUnderstanding {
  const explicit = detectExplicitErpIntent(base.rawText);
  const intent =
    base.intent ?? explicit ?? workspaceToIntent(base.workspace);

  const shootDate =
    base.shootDate ?? extractDateHint(base.rawText);
  const projectType =
    base.projectType ?? extractProjectType(base.rawText);

  const executeTarget =
    base.executeTarget ?? defaultExecuteTarget(intent);

  const workspace =
    explicit != null ? intentToWorkspace(intent) : base.workspace;

  const partial = {
    ...base,
    workspace,
    intent,
    shootDate,
    projectType,
    executeTarget,
  };

  const missingFields = computeMissingFields(partial);
  const asked = base.questionsAsked ?? [];
  const next = nextSmartQuestion(missingFields, asked);

  return {
    ...base,
    workspace,
    intent,
    lifecycle: base.lifecycle ?? "draft",
    shootDate,
    projectType,
    entities: base.entities ?? buildEntities(partial),
    missingFields,
    nextQuestionAr: next?.ar ?? null,
    nextQuestionEn: next?.en ?? null,
    questionsAsked: asked,
    potentialActions: buildPotentialActions(intent, executeTarget),
    executeTarget,
    canApprove: canApproveDraft(missingFields, base.confidence),
    erpAwareness: base.erpAwareness ?? [],
    voice: { enabled: false, mode: "stub", transcript: null },
    intelligenceProvider: "heuristic",
  };
}
