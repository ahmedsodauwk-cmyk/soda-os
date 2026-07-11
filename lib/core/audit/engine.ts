/**
 * Audit engine — append-only log of business events.
 * In-memory mirror always; best-effort persist to Supabase when available.
 */

import type { AuditLogEntry, BusinessEvent } from "@/lib/core/types";
import { createDomainDb } from "@/lib/supabase/domain-db";

const MAX_MEMORY = 2_000;
const auditCache: AuditLogEntry[] = [];
let persistAvailable: boolean | null = null;

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

function pushMemory(entry: AuditLogEntry): void {
  auditCache.unshift(entry);
  if (auditCache.length > MAX_MEMORY) {
    auditCache.length = MAX_MEMORY;
  }
}

async function persistEntry(entry: AuditLogEntry): Promise<void> {
  if (persistAvailable === false) return;
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
      // Table may not exist yet — degrade gracefully
      if (/relation .* does not exist|Could not find the table/i.test(error.message)) {
        persistAvailable = false;
        return;
      }
      console.warn(`[audit] persist failed: ${error.message}`);
      return;
    }
    persistAvailable = true;
  } catch (err) {
    persistAvailable = false;
    console.warn(
      `[audit] persist unavailable: ${err instanceof Error ? err.message : err}`
    );
  }
}

/** Append an audit entry from a business event (subscriber). */
export async function appendAuditFromEvent(event: BusinessEvent): Promise<void> {
  const entry = toEntry(event);
  pushMemory(entry);
  await persistEntry(entry);
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
