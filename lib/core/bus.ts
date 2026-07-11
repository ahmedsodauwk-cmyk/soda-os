/**
 * In-process event bus — publish / subscribe.
 * Handlers run sequentially; failures are isolated and logged.
 */

import type { BusinessEvent, BusinessEventHandler, BusinessEventType } from "@/lib/core/types";

type Wildcard = "*";

const handlers = new Map<BusinessEventType | Wildcard, Set<BusinessEventHandler>>();

export function subscribe(
  type: BusinessEventType | Wildcard,
  handler: BusinessEventHandler
): () => void {
  let set = handlers.get(type);
  if (!set) {
    set = new Set();
    handlers.set(type, set);
  }
  set.add(handler);
  return () => {
    set!.delete(handler);
  };
}

export function unsubscribe(
  type: BusinessEventType | Wildcard,
  handler: BusinessEventHandler
): void {
  handlers.get(type)?.delete(handler);
}

export async function emit(event: BusinessEvent): Promise<void> {
  const specific = handlers.get(event.type);
  const wild = handlers.get("*");
  const list = [
    ...(specific ? Array.from(specific) : []),
    ...(wild ? Array.from(wild) : []),
  ];

  for (const handler of list) {
    try {
      await handler(event);
    } catch (err) {
      console.error(
        `[business-core] handler failed for ${event.type} (${event.id}):`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

export function subscriberCount(type?: BusinessEventType | Wildcard): number {
  if (type) return handlers.get(type)?.size ?? 0;
  let n = 0;
  for (const set of handlers.values()) n += set.size;
  return n;
}

/** Test / reset helper — clears all subscriptions. */
export function resetBus(): void {
  handlers.clear();
}
