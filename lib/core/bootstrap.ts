/**
 * Register all Business Core subscribers once per process.
 */

import { subscribe } from "@/lib/core/bus";
import { appendAuditFromEvent } from "@/lib/core/audit/engine";
import { runFinanceAggregatorHook } from "@/lib/core/finance/hooks";
import { recordNotificationFromEvent } from "@/lib/core/notifications/engine";
import { markStatsDirtyFromEvent } from "@/lib/core/stats/engine";
import { registerSyncHandlers } from "@/lib/core/sync/handlers";

let bootstrapped = false;

export function bootstrapBusinessCore(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  // Cross-cutting foundations — real subscribers, not stubs with fake data
  subscribe("*", appendAuditFromEvent);
  subscribe("*", (event) => {
    recordNotificationFromEvent(event);
  });
  subscribe("*", (event) => {
    markStatsDirtyFromEvent(event);
  });
  subscribe("*", (event) => {
    runFinanceAggregatorHook(event);
  });

  registerSyncHandlers();
}

export function isBusinessCoreBootstrapped(): boolean {
  return bootstrapped;
}
