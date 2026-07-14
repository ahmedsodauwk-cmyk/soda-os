/**
 * SODA Brain server actions — Founder only (Operations Desk 05.3).
 * Phase A: parse / ask / prepare — never writes ERP.
 * Phase B: Execute Engine after Approve — may call existing ERP creates.
 * Chatbot Save path kept as brain-only alias for older clients.
 */

"use server";

import { revalidatePath } from "next/cache";

import {
  applyFollowUpAnswer,
  applyUnderstandingEdits,
  approveUnderstanding,
  loadErpAwarenessForLabels,
  refreshUnderstandingSummaries,
  runIntelligencePipeline,
  type BrainUnderstanding,
  type EntityTimeline,
  type IntelligenceParseResult,
  type RelatedMemory,
  type UnderstandingEdits,
} from "@/lib/brain/intelligence";
import { runExecuteEngine } from "@/lib/brain/execute-engine";
import { isFounderAccess } from "@/lib/identity/access-levels";
import { resolveSessionForApp } from "@/lib/identity/session";
import {
  appendBrainChatMessage,
  archiveBrainEntry,
  createBrainEntry,
  deleteBrainEntry,
  getBrainEntryById,
  listBrainChatMessages,
  listBrainEntries,
  listBrainHistory,
  preparePromoteStub,
  updateBrainEntry,
} from "@/lib/brain/repository";
import type {
  BrainChatMessage,
  BrainEntry,
  BrainHistoryRow,
  MoneyKind,
  NewBrainEntryInput,
  PromoteTarget,
  UpdateBrainEntryInput,
} from "@/lib/brain/types";

export type BrainActionResult = {
  ok: boolean;
  error?: string;
  entry?: BrainEntry;
  history?: BrainHistoryRow[];
  messages?: BrainChatMessage[];
  assistantText?: string;
  understanding?: BrainUnderstanding;
  related?: RelatedMemory[];
  timelines?: EntityTimeline[];
  suggestions?: string[];
  executeMode?: string;
  messageAr?: string;
  messageEn?: string;
};

async function requireBrainFounder() {
  const session = await resolveSessionForApp();
  if (!session || !isFounderAccess(session.profile.accessLevel)) {
    return null;
  }
  return session;
}

function revalidateBrain() {
  revalidatePath("/brain");
  revalidatePath("/brain/chat");
  revalidatePath("/brain/operations-desk");
}

export async function createBrainEntryAction(
  input: NewBrainEntryInput
): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };

  try {
    const entry = await createBrainEntry(input, session.userId);
    revalidateBrain();
    return { ok: true, entry };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create.",
    };
  }
}

export async function updateBrainEntryAction(
  id: string,
  patch: UpdateBrainEntryInput
): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };

  try {
    const entry = await updateBrainEntry(id, patch, session.userId);
    revalidateBrain();
    return { ok: true, entry };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update.",
    };
  }
}

export async function archiveBrainEntryAction(
  id: string
): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };

  try {
    const entry = await archiveBrainEntry(id, session.userId);
    revalidateBrain();
    return { ok: true, entry };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to archive.",
    };
  }
}

export async function deleteBrainEntryAction(
  id: string
): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };

  try {
    await deleteBrainEntry(id, session.userId);
    revalidateBrain();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete.",
    };
  }
}

export async function loadBrainHistoryAction(
  entryId: string
): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };

  try {
    const entry = await getBrainEntryById(entryId);
    if (!entry) return { ok: false, error: "Not found." };
    const history = await listBrainHistory(entryId);
    return { ok: true, entry, history };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load history.",
    };
  }
}

/** Stub — Promote Engine coming later. Does not touch ERP. */
export async function promoteBrainEntryAction(
  entryId: string,
  target: PromoteTarget
): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };
  const stub = await preparePromoteStub(entryId, target);
  return { ok: false, error: stub.error };
}

export type QuickCaptureInput = NewBrainEntryInput;

export async function quickCaptureBrainAction(
  input: QuickCaptureInput
): Promise<BrainActionResult> {
  return createBrainEntryAction(input);
}

async function awarenessLabelsFromUnderstanding(
  u: BrainUnderstanding
): Promise<BrainUnderstanding> {
  const labels = [
    u.companyLabel,
    u.clientLabel,
    u.personLabel,
  ].filter((x): x is string => Boolean(x?.trim()));
  if (labels.length === 0) return u;
  const erpAwareness = await loadErpAwarenessForLabels(labels);
  if (erpAwareness.length === 0) return u;
  return { ...u, erpAwareness };
}

/**
 * Parse Founder text → Understanding + Related Memories + ERP awareness (READ).
 * Does NOT create brain_entries or ERP rows.
 */
export async function understandBrainChatAction(input: {
  text: string;
}): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };

  const text = input.text.trim();
  if (!text) return { ok: false, error: "Empty message." };

  try {
    const entries = await listBrainEntries();
    const result: IntelligenceParseResult = runIntelligencePipeline(
      text,
      entries
    );
    const withErp = await awarenessLabelsFromUnderstanding(
      result.understanding
    );
    const understanding = refreshUnderstandingSummaries(withErp);

    return {
      ok: true,
      understanding,
      related: result.related,
      timelines: result.timelines,
      suggestions: [
        ...result.suggestions,
        ...understanding.erpAwareness.map((h) => h.noteAr),
      ].slice(0, 6),
      assistantText:
        understanding.founderSummaryAr || understanding.founderSummaryEn,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Parse failed.",
    };
  }
}

/**
 * Live Related Memories while typing (Context Engine).
 * No writes.
 */
export async function brainContextAction(input: {
  text: string;
}): Promise<BrainActionResult> {
  return understandBrainChatAction(input);
}

/**
 * Follow-up answer to the current ONE smart question.
 * Merges into draft — still no ERP write.
 */
export async function answerOpsQuestionAction(input: {
  understanding: BrainUnderstanding;
  answer: string;
}): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };

  const answer = input.answer.trim();
  if (!answer) return { ok: false, error: "Empty answer." };
  if (!input.understanding) return { ok: false, error: "No draft." };

  try {
    let next = applyFollowUpAnswer(input.understanding, answer);
    next = await awarenessLabelsFromUnderstanding(next);
    next = refreshUnderstandingSummaries(next);
    return {
      ok: true,
      understanding: next,
      assistantText: next.founderSummaryAr,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Follow-up failed.",
    };
  }
}

/**
 * Founder Approve — marks draft approved. Still no ERP / Brain write.
 */
export async function approveOpsDraftAction(input: {
  understanding: BrainUnderstanding;
}): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };
  if (!input.understanding) return { ok: false, error: "No draft." };

  if (!input.understanding.canApprove) {
    return {
      ok: false,
      error: input.understanding.nextQuestionAr ?? "لسه ناقص بيانات.",
      understanding: input.understanding,
    };
  }

  const understanding = approveUnderstanding(input.understanding);
  return {
    ok: true,
    understanding,
    assistantText: understanding.founderSummaryAr,
  };
}

/**
 * Founder Execute — Phase B. Calls Execute Engine.
 * Brain-only → Brain tables. ERP targets → existing createClient / createSmartOrder.
 */
export async function executeOpsDraftAction(input: {
  understanding: BrainUnderstanding;
  locale?: "en" | "ar";
}): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };
  if (!input.understanding) return { ok: false, error: "No draft." };

  const locale = input.locale === "en" ? "en" : "ar";
  const result = await runExecuteEngine(
    input.understanding,
    session.userId,
    locale
  );

  if (!result.ok) {
    return { ok: false, error: result.error, understanding: input.understanding };
  }

  revalidateBrain();
  if (result.mode === "erp_client" || result.mode === "erp_order") {
    revalidatePath("/clients");
    revalidatePath("/orders");
  }

  return {
    ok: true,
    entry: result.entry,
    messages: result.messages,
    executeMode: result.mode,
    messageAr: result.messageAr,
    messageEn: result.messageEn,
    assistantText: result.messageAr ?? result.messageEn,
    understanding: {
      ...input.understanding,
      lifecycle: "executed",
    },
  };
}

/**
 * Founder-approved structured save after Understanding Panel (legacy 05.2 path).
 * Stores raw_text + structured JSON + workspace + history timeline.
 * Never ERP — prefer executeOpsDraftAction with brain_save for Ops Desk.
 */
export async function confirmBrainUnderstandingAction(input: {
  understanding: BrainUnderstanding;
  edits?: UnderstandingEdits;
  locale?: "en" | "ar";
}): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };

  const base = input.understanding;
  if (!base?.rawText?.trim()) {
    return { ok: false, error: "Nothing to save." };
  }

  try {
    const u = input.edits
      ? applyUnderstandingEdits(base, input.edits)
      : base;

    const moneyKind: MoneyKind | null =
      u.workspace === "money_memory" ? u.moneyKind : null;

    const structuredData: Record<string, unknown> = {
      source: "brain_intelligence",
      layer: "05.2",
      heuristic: true,
      reasons: u.reasons,
      intent: u.intent,
      understanding: {
        workspace: u.workspace,
        moneyKind: u.moneyKind,
        moneyDirection: u.moneyDirection,
        amount: u.amount,
        currency: u.currency,
        personLabel: u.personLabel,
        companyLabel: u.companyLabel,
        clientLabel: u.clientLabel,
        phone: u.phone,
        confidence: u.confidence,
      },
    };

    const entry = await createBrainEntry(
      {
        workspace: u.workspace,
        title: u.title,
        body: u.rawText,
        rawText: u.rawText,
        moneyKind,
        amount: u.amount,
        amountNote: u.amount != null ? String(u.amount) : null,
        currency: u.currency,
        moneyDirection: u.moneyDirection,
        personLabel: u.personLabel,
        companyLabel: u.companyLabel,
        clientLabel: u.clientLabel,
        phone: u.phone,
        budgetNote: u.budgetNote,
        dueAt: u.dueAt,
        priority: u.priority,
        reminderEnabled: u.reminderEnabled,
        status: u.status ?? undefined,
        classification: u.workspace,
        classificationConfidence: u.confidence,
        classificationStatus: "classified",
        structuredData,
      },
      session.userId
    );

    const locale = input.locale === "en" ? "en" : "ar";
    const assistantText =
      locale === "ar" ? u.founderSummaryAr : u.founderSummaryEn;

    await appendBrainChatMessage({
      role: "user",
      content: u.rawText,
      classifiedWorkspace: u.workspace,
      entryId: entry.id,
      heuristicMeta: {
        reasons: u.reasons,
        confidence: u.confidence,
        pending: false,
        intelligence: true,
      },
      createdBy: session.userId,
    });

    await appendBrainChatMessage({
      role: "assistant",
      content: `${assistantText}\n\n✓ ${locale === "ar" ? "اتحفظت في الدماغ (Structured)" : "Saved in Brain (structured)"} · ${locale === "ar" ? "مفيش ERP" : "no ERP"}`,
      classifiedWorkspace: u.workspace,
      entryId: entry.id,
      heuristicMeta: {
        intelligence: true,
        moneyKind: u.moneyKind,
        structured: true,
        confidence: u.confidence,
      },
      createdBy: session.userId,
    });

    const messages = await listBrainChatMessages();
    revalidateBrain();
    return { ok: true, entry, messages, assistantText, understanding: u };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Save failed.",
    };
  }
}

/**
 * @deprecated Prefer understand → approve → execute.
 */
export async function sendBrainChatAction(input: {
  text: string;
  locale?: "en" | "ar";
}): Promise<BrainActionResult> {
  return understandBrainChatAction({ text: input.text });
}

export async function loadBrainChatAction(): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };
  try {
    const messages = await listBrainChatMessages();
    return { ok: true, messages };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load chat.",
    };
  }
}
