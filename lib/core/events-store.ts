/**
 * Persist business events (append-only) to Supabase.
 * Process memory is a warm cache only — production must persist to DB.
 * Local/dev may set ALLOW_IN_MEMORY_BUSINESS_CORE=1 to degrade without tables.
 */

import type { BusinessEvent, BusinessEventPayload } from "@/lib/core/types";
import { createDomainDb } from "@/lib/supabase/domain-db";

const MAX_MEMORY = 2_000;
const eventCache: BusinessEvent[] = [];

type BusinessEventRow = {
  id: string;
  type: string;
  occurred_at: string;
  source: string;
  correlation_id: string | null;
  entity_type: string;
  entity_id: string;
  payload: BusinessEventPayload;
};

function allowInMemoryFallback(): boolean {
  const flag = process.env.ALLOW_IN_MEMORY_BUSINESS_CORE?.trim();
  if (flag !== "1" && flag?.toLowerCase() !== "true") return false;
  // Never allow silent memory-only mode in production / Vercel production
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

function rowToEvent(row: BusinessEventRow): BusinessEvent {
  return {
    id: row.id,
    type: row.type as BusinessEvent["type"],
    occurredAt: row.occurred_at,
    source: row.source,
    correlationId: row.correlation_id ?? undefined,
    payload: {
      ...row.payload,
      entityType: (row.payload?.entityType ??
        row.entity_type) as BusinessEventPayload["entityType"],
      entityId: row.payload?.entityId ?? row.entity_id,
    },
  };
}

export function storeEventInMemory(event: BusinessEvent): void {
  eventCache.unshift(event);
  if (eventCache.length > MAX_MEMORY) {
    eventCache.length = MAX_MEMORY;
  }
}

function failPersist(context: string, detail: string): never {
  throw new Error(
    `[business-events] ${context}: ${detail}. ` +
      `Apply SODA_BUSINESS_CORE.sql (or migration 20260711000005_business_core.sql). ` +
      `Local-only escape hatch: ALLOW_IN_MEMORY_BUSINESS_CORE=1`
  );
}

export async function persistBusinessEvent(
  event: BusinessEvent
): Promise<void> {
  storeEventInMemory(event);

  try {
    const db = createDomainDb();
    const { error } = await db.from("business_events").insert({
      id: event.id,
      type: event.type,
      occurred_at: event.occurredAt,
      source: event.source,
      correlation_id: event.correlationId ?? null,
      entity_type: event.payload.entityType,
      entity_id: event.payload.entityId,
      payload: event.payload,
    });
    if (error) {
      if (isMissingTableError(error.message) && allowInMemoryFallback()) {
        console.warn(
          `[business-events] table missing — in-memory only (ALLOW_IN_MEMORY_BUSINESS_CORE): ${error.message}`
        );
        return;
      }
      failPersist("persist failed", error.message);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("[business-events]")) {
      throw err;
    }
    const detail = err instanceof Error ? err.message : String(err);
    if (allowInMemoryFallback()) {
      console.warn(
        `[business-events] persist unavailable — in-memory only: ${detail}`
      );
      return;
    }
    failPersist("persist unavailable", detail);
  }
}

/** Load recent events from Supabase into the process cache (serverless-safe). */
export async function refreshBusinessEventsFromDb(
  limit = 100
): Promise<BusinessEvent[]> {
  const capped = Math.max(0, Math.min(limit, MAX_MEMORY));
  try {
    const db = createDomainDb();
    const { data, error } = await db
      .from("business_events")
      .select(
        "id, type, occurred_at, source, correlation_id, entity_type, entity_id, payload"
      )
      .order("occurred_at", { ascending: false })
      .limit(capped);
    if (error) {
      if (isMissingTableError(error.message) && allowInMemoryFallback()) {
        return listBusinessEvents(capped);
      }
      failPersist("refresh failed", error.message);
    }
    const events = ((data ?? []) as BusinessEventRow[]).map(rowToEvent);
    eventCache.length = 0;
    for (const e of events) {
      eventCache.push(e);
    }
    return [...eventCache];
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("[business-events]")) {
      throw err;
    }
    const detail = err instanceof Error ? err.message : String(err);
    if (allowInMemoryFallback()) {
      return listBusinessEvents(capped);
    }
    failPersist("refresh unavailable", detail);
  }
}

export function listBusinessEvents(limit = 100): BusinessEvent[] {
  return eventCache.slice(0, Math.max(0, limit));
}

export function getBusinessEventsByEntity(
  entityType: string,
  entityId: string,
  limit = 50
): BusinessEvent[] {
  return eventCache
    .filter(
      (e) =>
        e.payload.entityType === entityType && e.payload.entityId === entityId
    )
    .slice(0, Math.max(0, limit));
}

export async function getBusinessEventsByEntityFromDb(
  entityType: string,
  entityId: string,
  limit = 50
): Promise<BusinessEvent[]> {
  const capped = Math.max(0, limit);
  try {
    const db = createDomainDb();
    const { data, error } = await db
      .from("business_events")
      .select(
        "id, type, occurred_at, source, correlation_id, entity_type, entity_id, payload"
      )
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("occurred_at", { ascending: false })
      .limit(capped);
    if (error) {
      if (isMissingTableError(error.message) && allowInMemoryFallback()) {
        return getBusinessEventsByEntity(entityType, entityId, capped);
      }
      failPersist("entity query failed", error.message);
    }
    return ((data ?? []) as BusinessEventRow[]).map(rowToEvent);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("[business-events]")) {
      throw err;
    }
    const detail = err instanceof Error ? err.message : String(err);
    if (allowInMemoryFallback()) {
      return getBusinessEventsByEntity(entityType, entityId, capped);
    }
    failPersist("entity query unavailable", detail);
  }
}

export function clearBusinessEventMemory(): void {
  eventCache.length = 0;
}
