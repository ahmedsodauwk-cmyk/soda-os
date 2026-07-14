/**
 * SODA Brain repository — isolated Founder second brain.
 * NEVER writes to clients / orders / projects / finance / crew / calendar.
 */

import { createDomainDb } from "@/lib/supabase/domain-db";
import {
  defaultStatusForWorkspace,
  type BrainEntry,
  type BrainHistoryAction,
  type BrainHistoryRow,
  type BrainWorkspace,
  type ClassificationStatus,
  type MoneyKind,
  type NewBrainEntryInput,
  type PromoteTarget,
  type UpdateBrainEntryInput,
} from "@/lib/brain/types";

type BrainEntryRow = {
  id: string;
  workspace: string;
  title: string | null;
  body: string;
  status: string | null;
  confidence: number | null;
  client_label: string | null;
  money_kind: string | null;
  amount_note: string | null;
  due_at: string | null;
  tags: string[] | null;
  raw_text: string | null;
  classification_status: string | null;
  promote_target: string | null;
  promoted_at: string | null;
  promoted_ref: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type BrainHistoryDbRow = {
  id: string;
  entry_id: string;
  changed_at: string;
  changed_by: string | null;
  action: string;
  snapshot: Record<string, unknown> | null;
  note: string | null;
};

function newBrainId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `brain-${crypto.randomUUID()}`;
  }
  return `brain-${Date.now().toString(36)}`;
}

function newHistoryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `bh-${crypto.randomUUID()}`;
  }
  return `bh-${Date.now().toString(36)}`;
}

function rowToEntry(row: BrainEntryRow): BrainEntry {
  return {
    id: row.id,
    workspace: row.workspace as BrainWorkspace,
    title: row.title,
    body: row.body ?? "",
    status: row.status,
    confidence: row.confidence,
    clientLabel: row.client_label,
    moneyKind: (row.money_kind as MoneyKind | null) ?? null,
    amountNote: row.amount_note,
    dueAt: row.due_at,
    tags: Array.isArray(row.tags) ? row.tags : [],
    rawText: row.raw_text,
    classificationStatus:
      (row.classification_status as ClassificationStatus | null) ?? null,
    promoteTarget: (row.promote_target as PromoteTarget | null) ?? null,
    promotedAt: row.promoted_at,
    promotedRef: row.promoted_ref,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToHistory(row: BrainHistoryDbRow): BrainHistoryRow {
  return {
    id: row.id,
    entryId: row.entry_id,
    changedAt: row.changed_at,
    changedBy: row.changed_by,
    action: row.action as BrainHistoryAction,
    snapshot: row.snapshot ?? {},
    note: row.note,
  };
}

function entrySnapshot(entry: BrainEntry): Record<string, unknown> {
  return {
    id: entry.id,
    workspace: entry.workspace,
    title: entry.title,
    body: entry.body,
    status: entry.status,
    confidence: entry.confidence,
    clientLabel: entry.clientLabel,
    moneyKind: entry.moneyKind,
    amountNote: entry.amountNote,
    dueAt: entry.dueAt,
    tags: entry.tags,
    updatedAt: entry.updatedAt,
  };
}

function isMissingTableError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("brain_entries") &&
    (m.includes("does not exist") ||
      m.includes("schema cache") ||
      m.includes("could not find"))
  );
}

async function appendHistory(input: {
  entryId: string;
  action: BrainHistoryAction;
  changedBy: string | null;
  snapshot: Record<string, unknown>;
  note?: string | null;
}): Promise<void> {
  const db = createDomainDb();
  const { error } = await db.from("brain_entry_history").insert({
    id: newHistoryId(),
    entry_id: input.entryId,
    changed_by: input.changedBy,
    action: input.action,
    snapshot: input.snapshot,
    note: input.note ?? null,
  });
  if (error) {
    // History is best-effort if migration partially applied
    console.error("[brain] history append failed:", error.message);
  }
}

/** List all Brain entries, newest updated first. Empty if table missing. */
export async function listBrainEntries(opts?: {
  workspace?: BrainWorkspace;
}): Promise<BrainEntry[]> {
  const db = createDomainDb();
  let query = db
    .from("brain_entries")
    .select("*")
    .order("updated_at", { ascending: false });

  if (opts?.workspace) {
    query = query.eq("workspace", opts.workspace);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error.message)) return [];
    throw new Error(`Failed to load SODA Brain: ${error.message}`);
  }
  return ((data ?? []) as BrainEntryRow[]).map(rowToEntry);
}

export async function getBrainEntryById(
  id: string
): Promise<BrainEntry | null> {
  const db = createDomainDb();
  const { data, error } = await db
    .from("brain_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) return null;
    throw new Error(`Failed to load Brain entry: ${error.message}`);
  }
  if (!data) return null;
  return rowToEntry(data as BrainEntryRow);
}

export async function listBrainHistory(
  entryId: string
): Promise<BrainHistoryRow[]> {
  const db = createDomainDb();
  const { data, error } = await db
    .from("brain_entry_history")
    .select("*")
    .eq("entry_id", entryId)
    .order("changed_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) return [];
    throw new Error(`Failed to load Brain history: ${error.message}`);
  }
  return ((data ?? []) as BrainHistoryDbRow[]).map(rowToHistory);
}

/**
 * Smart search across all Brain workspaces.
 * Matches title, body, client_label, amount_note, status, tags, raw_text.
 * In-memory filter — Founder-private corpus stays small; avoids PostgREST OR edge cases.
 */
export async function searchBrainEntries(
  query: string
): Promise<BrainEntry[]> {
  const q = query.trim().toLowerCase();
  const all = await listBrainEntries();
  if (!q) return all;

  return all.filter((e) => {
    const hay = [
      e.title,
      e.body,
      e.clientLabel,
      e.amountNote,
      e.status,
      e.rawText,
      e.moneyKind,
      e.workspace,
      e.tags.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export async function createBrainEntry(
  input: NewBrainEntryInput,
  createdBy: string | null
): Promise<BrainEntry> {
  const db = createDomainDb();
  const id = newBrainId();
  const status =
    input.status ?? defaultStatusForWorkspace(input.workspace);
  const body = input.body ?? "";
  const row = {
    id,
    workspace: input.workspace,
    title: input.title?.trim() || null,
    body,
    status,
    confidence:
      input.workspace === "potential_orders"
        ? Math.min(100, Math.max(0, input.confidence ?? 0))
        : null,
    client_label: input.clientLabel?.trim() || null,
    money_kind: input.moneyKind ?? null,
    amount_note: input.amountNote?.trim() || null,
    due_at: input.dueAt || null,
    tags: input.tags ?? [],
    raw_text: input.rawText ?? (body || input.title || null),
    classification_status: null,
    promote_target: null,
    promoted_at: null,
    promoted_ref: null,
    created_by: createdBy,
  };

  const { data, error } = await db
    .from("brain_entries")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create Brain entry: ${error.message}`);
  }

  const entry = rowToEntry(data as BrainEntryRow);
  await appendHistory({
    entryId: entry.id,
    action: "created",
    changedBy: createdBy,
    snapshot: entrySnapshot(entry),
  });
  return entry;
}

export async function updateBrainEntry(
  id: string,
  patch: UpdateBrainEntryInput,
  changedBy: string | null
): Promise<BrainEntry> {
  const existing = await getBrainEntryById(id);
  if (!existing) throw new Error("Brain entry not found.");

  const db = createDomainDb();
  const updates: Record<string, unknown> = {};

  if (patch.title !== undefined) updates.title = patch.title?.trim() || null;
  if (patch.body !== undefined) {
    updates.body = patch.body;
    updates.raw_text = patch.body || existing.rawText;
  }
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.confidence !== undefined) {
    updates.confidence =
      patch.confidence == null
        ? null
        : Math.min(100, Math.max(0, patch.confidence));
  }
  if (patch.clientLabel !== undefined) {
    updates.client_label = patch.clientLabel?.trim() || null;
  }
  if (patch.moneyKind !== undefined) updates.money_kind = patch.moneyKind;
  if (patch.amountNote !== undefined) {
    updates.amount_note = patch.amountNote?.trim() || null;
  }
  if (patch.dueAt !== undefined) updates.due_at = patch.dueAt || null;
  if (patch.tags !== undefined) updates.tags = patch.tags;
  if (patch.rawText !== undefined) updates.raw_text = patch.rawText;

  const { data, error } = await db
    .from("brain_entries")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update Brain entry: ${error.message}`);
  }

  const entry = rowToEntry(data as BrainEntryRow);
  const action: BrainHistoryAction =
    patch.status !== undefined && patch.status !== existing.status
      ? "status_changed"
      : "updated";

  await appendHistory({
    entryId: entry.id,
    action,
    changedBy,
    snapshot: entrySnapshot(entry),
    note:
      action === "status_changed"
        ? `${existing.status ?? "—"} → ${entry.status ?? "—"}`
        : null,
  });
  return entry;
}

export async function deleteBrainEntry(
  id: string,
  changedBy: string | null
): Promise<void> {
  const existing = await getBrainEntryById(id);
  if (!existing) return;

  await appendHistory({
    entryId: id,
    action: "deleted",
    changedBy,
    snapshot: entrySnapshot(existing),
  });

  const db = createDomainDb();
  const { error } = await db.from("brain_entries").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete Brain entry: ${error.message}`);
  }
}

/**
 * Stub for future Promote Engine.
 * Does NOT create ERP records. Reserved for later missions.
 */
export async function preparePromoteStub(
  _entryId: string,
  _target: PromoteTarget
): Promise<{ ok: false; error: string }> {
  return {
    ok: false,
    error: "Promote Engine coming later — structure only in Mission 05.0.",
  };
}
