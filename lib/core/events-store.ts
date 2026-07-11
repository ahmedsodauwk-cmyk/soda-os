/**
 * Persist business events (append-only) — in-memory + optional Supabase.
 */

import type { BusinessEvent } from "@/lib/core/types";
import { createDomainDb } from "@/lib/supabase/domain-db";

const MAX_MEMORY = 2_000;
const eventCache: BusinessEvent[] = [];
let persistAvailable: boolean | null = null;

export function storeEventInMemory(event: BusinessEvent): void {
  eventCache.unshift(event);
  if (eventCache.length > MAX_MEMORY) {
    eventCache.length = MAX_MEMORY;
  }
}

export async function persistBusinessEvent(
  event: BusinessEvent
): Promise<void> {
  storeEventInMemory(event);
  if (persistAvailable === false) return;

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
      if (/relation .* does not exist|Could not find the table/i.test(error.message)) {
        persistAvailable = false;
        return;
      }
      console.warn(`[business-events] persist failed: ${error.message}`);
      return;
    }
    persistAvailable = true;
  } catch (err) {
    persistAvailable = false;
    console.warn(
      `[business-events] persist unavailable: ${
        err instanceof Error ? err.message : err
      }`
    );
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

export function clearBusinessEventMemory(): void {
  eventCache.length = 0;
}
