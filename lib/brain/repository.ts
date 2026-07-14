/**
 * SODA Brain repository — isolated Founder second brain (Mission 05.1).
 * NEVER writes to clients / orders / projects / finance / crew / calendar.
 */

import { createDomainDb } from "@/lib/supabase/domain-db";
import {
  defaultStatusForWorkspace,
  type BrainChatMessage,
  type BrainChatRole,
  type BrainCurrency,
  type BrainEntry,
  type BrainHistoryAction,
  type BrainHistoryRow,
  type BrainPriority,
  type BrainWorkspace,
  type ClassificationStatus,
  type MoneyDirection,
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
  structured_data?: Record<string, unknown> | null;
  currency?: string | null;
  amount?: number | string | null;
  money_direction?: string | null;
  priority?: string | null;
  person_label?: string | null;
  company_label?: string | null;
  phone?: string | null;
  budget_note?: string | null;
  reminder_enabled?: boolean | null;
  raw_text: string | null;
  classification_status: string | null;
  classification?: string | null;
  classification_confidence?: number | string | null;
  future_ai_summary?: string | null;
  promote_target: string | null;
  promoted_at: string | null;
  promoted_ref: string | null;
  archived_at?: string | null;
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

type BrainChatDbRow = {
  id: string;
  role: string;
  content: string;
  classified_workspace: string | null;
  entry_id: string | null;
  heuristic_meta: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
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

function newChatId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `bcm-${crypto.randomUUID()}`;
  }
  return `bcm-${Date.now().toString(36)}`;
}

function numOrNull(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
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
    structuredData:
      row.structured_data && typeof row.structured_data === "object"
        ? row.structured_data
        : {},
    currency: (row.currency as BrainCurrency | null) ?? null,
    amount: numOrNull(row.amount),
    moneyDirection: (row.money_direction as MoneyDirection | null) ?? null,
    priority: (row.priority as BrainPriority | null) ?? null,
    personLabel: row.person_label ?? null,
    companyLabel: row.company_label ?? null,
    phone: row.phone ?? null,
    budgetNote: row.budget_note ?? null,
    reminderEnabled: Boolean(row.reminder_enabled),
    rawText: row.raw_text,
    classificationStatus:
      (row.classification_status as ClassificationStatus | null) ?? null,
    classification: row.classification ?? null,
    classificationConfidence: numOrNull(row.classification_confidence),
    futureAiSummary: row.future_ai_summary ?? null,
    promoteTarget: (row.promote_target as PromoteTarget | null) ?? null,
    promotedAt: row.promoted_at,
    promotedRef: row.promoted_ref,
    archivedAt: row.archived_at ?? null,
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

function rowToChat(row: BrainChatDbRow): BrainChatMessage {
  return {
    id: row.id,
    role: row.role as BrainChatRole,
    content: row.content ?? "",
    classifiedWorkspace:
      (row.classified_workspace as BrainWorkspace | null) ?? null,
    entryId: row.entry_id,
    heuristicMeta: row.heuristic_meta ?? {},
    createdBy: row.created_by,
    createdAt: row.created_at,
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
    amount: entry.amount,
    currency: entry.currency,
    moneyDirection: entry.moneyDirection,
    priority: entry.priority,
    personLabel: entry.personLabel,
    companyLabel: entry.companyLabel,
    phone: entry.phone,
    budgetNote: entry.budgetNote,
    dueAt: entry.dueAt,
    tags: entry.tags,
    archivedAt: entry.archivedAt,
    updatedAt: entry.updatedAt,
  };
}

function isMissingTableError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    (m.includes("brain_entries") ||
      m.includes("brain_chat_messages") ||
      m.includes("brain_entry_history")) &&
    (m.includes("does not exist") ||
      m.includes("schema cache") ||
      m.includes("could not find"))
  );
}

function isMissingColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("column") &&
    (m.includes("does not exist") || m.includes("schema cache"))
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
 * Matches title, body, labels, amount, status, tags, raw_text, phone, budget.
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
      e.personLabel,
      e.companyLabel,
      e.amountNote,
      e.budgetNote,
      e.phone,
      e.status,
      e.rawText,
      e.classification,
      e.moneyKind,
      e.workspace,
      e.priority,
      e.currency,
      e.amount != null ? String(e.amount) : null,
      e.tags.join(" "),
      JSON.stringify(e.structuredData),
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
  const row: Record<string, unknown> = {
    id,
    workspace: input.workspace,
    title: input.title?.trim() || null,
    body,
    status,
    confidence:
      input.workspace === "potential_orders"
        ? Math.min(100, Math.max(0, input.confidence ?? 0))
        : input.confidence ?? null,
    client_label: input.clientLabel?.trim() || null,
    money_kind: input.moneyKind ?? null,
    amount_note: input.amountNote?.trim() || null,
    due_at: input.dueAt || null,
    tags: input.tags ?? [],
    structured_data: input.structuredData ?? {},
    currency: input.currency ?? null,
    amount: input.amount ?? null,
    money_direction: input.moneyDirection ?? null,
    priority: input.priority ?? null,
    person_label: input.personLabel?.trim() || null,
    company_label: input.companyLabel?.trim() || null,
    phone: input.phone?.trim() || null,
    budget_note: input.budgetNote?.trim() || null,
    reminder_enabled: input.reminderEnabled ?? false,
    raw_text: input.rawText ?? (body || input.title || null),
    classification_status: input.classificationStatus ?? null,
    classification: input.classification ?? null,
    classification_confidence: input.classificationConfidence ?? null,
    future_ai_summary: null,
    promote_target: null,
    promoted_at: null,
    promoted_ref: null,
    archived_at: input.workspace === "archive" ? new Date().toISOString() : null,
    created_by: createdBy,
  };

  let { data, error } = await db
    .from("brain_entries")
    .insert(row)
    .select("*")
    .single();

  // Graceful fallback if evolution migration not applied yet
  if (error && isMissingColumnError(error.message)) {
    const legacy = {
      id,
      workspace: ["personal_decisions", "meeting_notes", "future_plans", "archive"].includes(
        input.workspace
      )
        ? "inbox"
        : input.workspace,
      title: row.title,
      body: row.body,
      status: row.status,
      confidence: row.confidence,
      client_label: row.client_label,
      money_kind:
        input.moneyKind === "crew_advance" || input.moneyKind === "client_debt"
          ? "note"
          : input.moneyKind,
      amount_note: row.amount_note,
      due_at: row.due_at,
      tags: row.tags,
      raw_text: row.raw_text,
      classification_status: null,
      promote_target: null,
      promoted_at: null,
      promoted_ref: null,
      created_by: createdBy,
    };
    const retry = await db.from("brain_entries").insert(legacy).select("*").single();
    data = retry.data;
    error = retry.error;
  }

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

  if (patch.workspace !== undefined) updates.workspace = patch.workspace;
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
  if (patch.structuredData !== undefined) {
    updates.structured_data = patch.structuredData;
  }
  if (patch.currency !== undefined) updates.currency = patch.currency;
  if (patch.amount !== undefined) updates.amount = patch.amount;
  if (patch.moneyDirection !== undefined) {
    updates.money_direction = patch.moneyDirection;
  }
  if (patch.priority !== undefined) updates.priority = patch.priority;
  if (patch.personLabel !== undefined) {
    updates.person_label = patch.personLabel?.trim() || null;
  }
  if (patch.companyLabel !== undefined) {
    updates.company_label = patch.companyLabel?.trim() || null;
  }
  if (patch.phone !== undefined) updates.phone = patch.phone?.trim() || null;
  if (patch.budgetNote !== undefined) {
    updates.budget_note = patch.budgetNote?.trim() || null;
  }
  if (patch.reminderEnabled !== undefined) {
    updates.reminder_enabled = patch.reminderEnabled;
  }
  if (patch.classification !== undefined) {
    updates.classification = patch.classification;
  }
  if (patch.classificationConfidence !== undefined) {
    updates.classification_confidence = patch.classificationConfidence;
  }
  if (patch.classificationStatus !== undefined) {
    updates.classification_status = patch.classificationStatus;
  }
  if (patch.archivedAt !== undefined) updates.archived_at = patch.archivedAt;

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
  let action: BrainHistoryAction = "updated";
  let note: string | null = null;
  if (patch.workspace === "archive" || patch.archivedAt) {
    action = "archived";
    note = "Moved to Archive";
  } else if (patch.status !== undefined && patch.status !== existing.status) {
    action = "status_changed";
    note = `${existing.status ?? "—"} → ${entry.status ?? "—"}`;
  }

  await appendHistory({
    entryId: entry.id,
    action,
    changedBy,
    snapshot: entrySnapshot(entry),
    note,
  });
  return entry;
}

export async function archiveBrainEntry(
  id: string,
  changedBy: string | null
): Promise<BrainEntry> {
  return updateBrainEntry(
    id,
    {
      workspace: "archive",
      status: "Archived",
      archivedAt: new Date().toISOString(),
    },
    changedBy
  );
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

export async function listBrainChatMessages(
  limit = 80
): Promise<BrainChatMessage[]> {
  const db = createDomainDb();
  const { data, error } = await db
    .from("brain_chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error.message)) return [];
    throw new Error(`Failed to load Brain chat: ${error.message}`);
  }
  return ((data ?? []) as BrainChatDbRow[]).map(rowToChat);
}

export async function appendBrainChatMessage(input: {
  role: BrainChatRole;
  content: string;
  classifiedWorkspace?: BrainWorkspace | null;
  entryId?: string | null;
  heuristicMeta?: Record<string, unknown>;
  createdBy: string | null;
}): Promise<BrainChatMessage> {
  const db = createDomainDb();
  const row = {
    id: newChatId(),
    role: input.role,
    content: input.content,
    classified_workspace: input.classifiedWorkspace ?? null,
    entry_id: input.entryId ?? null,
    heuristic_meta: input.heuristicMeta ?? {},
    created_by: input.createdBy,
  };

  const { data, error } = await db
    .from("brain_chat_messages")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save Brain chat: ${error.message}`);
  }
  return rowToChat(data as BrainChatDbRow);
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
    error:
      "Promote Engine coming later — Convert to Order/Client/Reminder/Calendar/Finance is disabled.",
  };
}
