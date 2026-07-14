/**
 * SODA Brain server actions — Founder only.
 * NEVER creates Client / Order / Project / Finance / Crew / Calendar records.
 */

"use server";

import { revalidatePath } from "next/cache";

import { isFounderAccess } from "@/lib/identity/access-levels";
import { resolveSessionForApp } from "@/lib/identity/session";
import {
  createBrainEntry,
  deleteBrainEntry,
  getBrainEntryById,
  listBrainHistory,
  preparePromoteStub,
  updateBrainEntry,
} from "@/lib/brain/repository";
import type {
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

export type QuickCaptureInput = {
  workspace: BrainWorkspace;
  title?: string;
  body: string;
  status?: string | null;
  confidence?: number | null;
  clientLabel?: string | null;
  moneyKind?: MoneyKind | null;
  amountNote?: string | null;
  dueAt?: string | null;
};

export async function quickCaptureBrainAction(
  input: QuickCaptureInput
): Promise<BrainActionResult> {
  return createBrainEntryAction({
    workspace: input.workspace,
    title: input.title ?? null,
    body: input.body,
    status: input.status,
    confidence: input.confidence,
    clientLabel: input.clientLabel,
    moneyKind: input.moneyKind,
    amountNote: input.amountNote,
    dueAt: input.dueAt,
  });
}
