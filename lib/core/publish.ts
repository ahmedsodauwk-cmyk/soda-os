/**
 * Publish a business event — persists, audits via subscribers, notifies sync.
 */

import { emit } from "@/lib/core/bus";
import { persistBusinessEvent } from "@/lib/core/events-store";
import type { BusinessEvent, BusinessEventInput } from "@/lib/core/types";

let bootstrapPromise: Promise<void> | null = null;

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `bev-${crypto.randomUUID()}`;
  }
  return `bev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureBootstrapped(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = import("@/lib/core/bootstrap").then((m) =>
      m.bootstrapBusinessCore()
    );
  }
  await bootstrapPromise;
}

/**
 * Publish through Business Core. Repositories / engines call this AFTER
 * their own table writes succeed. Handlers perform cross-module sync.
 */
export async function publishBusinessEvent(
  input: BusinessEventInput
): Promise<BusinessEvent> {
  await ensureBootstrapped();

  const event: BusinessEvent = {
    id: input.id ?? newEventId(),
    type: input.type,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    source: input.source,
    payload: input.payload,
    correlationId: input.correlationId,
  };

  await persistBusinessEvent(event);
  await emit(event);
  return event;
}

/**
 * Fire-and-forget publish for call sites that must not block on handlers.
 * Errors are logged; the originating mutation already succeeded.
 */
export function publishBusinessEventBackground(
  input: BusinessEventInput
): void {
  void publishBusinessEvent(input).catch((err) => {
    console.error(
      `[business-core] publish failed (${input.type}):`,
      err instanceof Error ? err.message : err
    );
  });
}
