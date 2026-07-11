/**
 * Audit engine — append-only log of business events.
 * Persists to Supabase; process memory is a warm cache only.
 */

import type { AuditLogEntry, BusinessEvent } from "@/lib/core/types";
import { createDomainDb } from "@/lib/supabase/domain-db";

const MAX_MEMORY = 2_000;
const auditCache: AuditLogEntry[] = [];

type AuditRow = {
  id: string;
  event_id: string;
  event_type: string;
  occurred_at: string;
  source: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  payload: AuditLogEntry["payload"];
};

function allowInMemoryFallback(): boolean {
  const flag = process.env.ALLOW_IN_MEMORY_BUSINESS_CORE?.trim();
  if (flag !== "1" && flag?.toLowerCase() !== "true") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview") {
    return false;
  }
  return true;
}

function isMissingTableError(message: string): boolean {
  return /relation .* does not exist|Could not find the table|schema cache/i.test(
    message
  );
}

function toEntry(event: BusinessEvent): AuditLogEntry {
  return {
    id: `audit-${event.id}`,
    eventId: event.id,
    eventType: event.type,
    occurredAt: event.occurredAt,
    source: event.source,
    entityType: event.payload.entityType,
    entityId: event.payload.entityId,
    summary:
      event.payload.summary ??
      `${event.type} · ${event.payload.entityType}:${event.payload.entityId}`,
    payload: event.payload,
  };
}

function rowToEntry(row: AuditRow): AuditLogEntry {
  return {
    id: row.id,
    eventId: row.event_id,
    eventType: row.event_type as AuditLogEntry["eventType"],
    occurredAt: row.occurred_at,
    source: row.source,
    entityType: row.entity_type as AuditLogEntry["entityType"],
    entityId: row.entity_id,
    summary: row.summary,
    payload: row.payload,
  };
}

function pushMemory(entry: AuditLogEntry): void {
  auditCache.unshift(entry);
  if (auditCache.length > MAX_MEMORY) {
    auditCache.length = MAX_MEMORY;
  }
}

function failPersist(context: string, detail: string): never {
  throw new Error(
    `[audit] ${context}: ${detail}. ` +
      `Apply SODA_BUSINESS_CORE.sql. Local-only: ALLOW_IN_MEMORY_BUSINESS_CORE=1`
  );
}

async function persistEntry(entry: AuditLogEntry): Promise<void> {
  try {
    const db = createDomainDb();
    const { error } = await db.from("audit_log").insert({
      id: entry.id,
      event_id: entry.eventId,
      event_type: entry.eventType,
      occurred_at: entry.occurredAt,
      source: entry.source,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      summary: entry.summary,
      payload: entry.payload,
    });
    if (error) {
      if (isMissingTableError(error.message) && allowInMemoryFallback()) {
        console.warn(
          `[audit] table missing — in-memory only (ALLOW_IN_MEMORY_BUSINESS_CORE): ${error.message}`
        );
        return;
      }
      failPersist("persist failed", error.message);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("[audit]")) {
      throw err;
    }
    const detail = err instanceof Error ? err.message : String(err);
    if (allowInMemoryFallback()) {
      console.warn(`[audit] persist unavailable — in-memory only: ${detail}`);
      return;
    }
    failPersist("persist unavailable", detail);
  }
}

/** Append an audit entry from a business event (subscriber). */
export async function appendAuditFromEvent(event: BusinessEvent): Promise<void> {
  const entry = toEntry(event);
  pushMemory(entry);
  await persistEntry(entry);
}

/** Load recent audit rows from Supabase into the process cache. */
export async function refreshAuditLogFromDb(
  limit = 100
): Promise<AuditLogEntry[]> {
  const capped = Math.max(0, Math.min(limit, MAX_MEMORY));
  try {
    const db = createDomainDb();
    const { data, error } = await db
      .from("audit_log")
      .select(
        "id, event_id, event_type, occurred_at, source, entity_type, entity_id, summary, payload"
      )
      .order("occurred_at", { ascending: false })
      .limit(capped);
    if (error) {
      if (isMissingTableError(error.message) && allowInMemoryFallback()) {
        return listAuditLog(capped);
      }
      failPersist("refresh failed", error.message);
    }
    const entries = ((data ?? []) as AuditRow[]).map(rowToEntry);
    auditCache.length = 0;
    for (const e of entries) {
      auditCache.push(e);
    }
    return [...auditCache];
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("[audit]")) {
      throw err;
    }
    const detail = err instanceof Error ? err.message : String(err);
    if (allowInMemoryFallback()) {
      return listAuditLog(capped);
    }
    failPersist("refresh unavailable", detail);
  }
}

export function listAuditLog(limit = 100): AuditLogEntry[] {
  return auditCache.slice(0, Math.max(0, limit));
}

export function getAuditByEntity(
  entityType: string,
  entityId: string,
  limit = 50
): AuditLogEntry[] {
  return auditCache
    .filter((e) => e.entityType === entityType && e.entityId === entityId)
    .slice(0, Math.max(0, limit));
}

export function clearAuditMemory(): void {
  auditCache.length = 0;
}
