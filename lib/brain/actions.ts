/**
 * SODA Brain server actions — Founder only (Mission 05.1).
 * NEVER creates Client / Order / Project / Finance / Crew / Calendar records.
 */

"use server";

import { revalidatePath } from "next/cache";

import {
  classifyBrainText,
  formatClassificationReply,
} from "@/lib/brain/classify";
import { isFounderAccess } from "@/lib/identity/access-levels";
import { resolveSessionForApp } from "@/lib/identity/session";
import {
  appendBrainChatMessage,
  archiveBrainEntry,
  createBrainEntry,
  deleteBrainEntry,
  getBrainEntryById,
  listBrainChatMessages,
  listBrainHistory,
  preparePromoteStub,
  updateBrainEntry,
} from "@/lib/brain/repository";
import type {
  BrainChatMessage,
  BrainEntry,
  BrainHistoryRow,
  BrainWorkspace,
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

/**
 * Founder Chat — heuristic classify into Brain only.
 * Arabic OK. NEVER creates ERP entities.
 */
export async function sendBrainChatAction(input: {
  text: string;
  locale?: "en" | "ar";
}): Promise<BrainActionResult> {
  const session = await requireBrainFounder();
  if (!session) return { ok: false, error: "Founder only." };

  const text = input.text.trim();
  if (!text) return { ok: false, error: "Empty message." };

  try {
    const classification = classifyBrainText(text);
    const locale = input.locale === "ar" ? "ar" : "en";

    const moneyKind: MoneyKind | null =
      classification.workspace === "money_memory"
        ? classification.moneyKind
        : null;

    const entry = await createBrainEntry(
      {
        workspace: classification.workspace,
        title: classification.suggestedTitle,
        body: text,
        rawText: text,
        moneyKind,
        amount: classification.extractedAmount,
        amountNote:
          classification.extractedAmount != null
            ? String(classification.extractedAmount)
            : null,
        phone: classification.extractedPhone,
        classification: classification.workspace,
        classificationConfidence: classification.confidence,
        classificationStatus: "classified",
        structuredData: {
          source: "brain_chat",
          heuristic: true,
          reasons: classification.reasons,
        },
        status: undefined,
      },
      session.userId
    );

    await appendBrainChatMessage({
      role: "user",
      content: text,
      classifiedWorkspace: classification.workspace,
      entryId: entry.id,
      heuristicMeta: {
        reasons: classification.reasons,
        confidence: classification.confidence,
      },
      createdBy: session.userId,
    });

    const assistantText = formatClassificationReply(classification, locale);
    await appendBrainChatMessage({
      role: "assistant",
      content: assistantText,
      classifiedWorkspace: classification.workspace,
      entryId: entry.id,
      heuristicMeta: {
        heuristic: true,
        moneyKind: classification.moneyKind,
      },
      createdBy: session.userId,
    });

    const messages = await listBrainChatMessages();
    revalidateBrain();
    return { ok: true, entry, messages, assistantText };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Chat failed.",
    };
  }
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
