/**
 * Statistics engine foundation — generation counters + dirty flags
 * so dashboard / client / workspace stats know when to recompute.
 * Reuses lib/business compute* helpers; does not duplicate formulas.
 */

import type { BusinessEvent, BusinessEventType } from "@/lib/core/types";

const STATS_TOUCHING: ReadonlySet<BusinessEventType> = new Set([
  "ClientCreated",
  "ClientUpdated",
  "ProjectCreated",
  "ProjectUpdated",
  "OrderCreated",
  "OrderUpdated",
  "OrderConfirmed",
  "OrderCompleted",
  "OrderCancelled",
  "PaymentReceived",
  "PaymentUpdated",
  "InvoiceCreated",
  "InvoicePaid",
  "InvoiceUpdated",
  "DeliveryCompleted",
  "DeliveryCreated",
  "CrewAssigned",
  "CrewRemoved",
  "CrewPaid",
  "CrewBonusGenerated",
  "QuotationConverted",
  "FinancialReversed",
  "FinancialVoided",
  "FinancialCorrected",
]);

export interface StatsSnapshotMeta {
  generation: number;
  lastEventId: string | null;
  lastEventType: BusinessEventType | null;
  lastOccurredAt: string | null;
  dirtyClientIds: Set<string>;
  dirtyProjectIds: Set<string>;
  dirtyOrderIds: Set<string>;
  dashboardDirty: boolean;
}

const meta: StatsSnapshotMeta = {
  generation: 0,
  lastEventId: null,
  lastEventType: null,
  lastOccurredAt: null,
  dirtyClientIds: new Set(),
  dirtyProjectIds: new Set(),
  dirtyOrderIds: new Set(),
  dashboardDirty: false,
};

/** Mark stats dirty from a business event (subscriber). */
export function markStatsDirtyFromEvent(event: BusinessEvent): void {
  if (!STATS_TOUCHING.has(event.type)) return;

  meta.generation += 1;
  meta.lastEventId = event.id;
  meta.lastEventType = event.type;
  meta.lastOccurredAt = event.occurredAt;
  meta.dashboardDirty = true;

  const p = event.payload;
  if (p.clientId) meta.dirtyClientIds.add(p.clientId);
  if (p.entityType === "client") meta.dirtyClientIds.add(p.entityId);
  if (p.projectId) meta.dirtyProjectIds.add(p.projectId);
  if (p.entityType === "project") meta.dirtyProjectIds.add(p.entityId);
  if (p.orderId) meta.dirtyOrderIds.add(p.orderId);
  if (p.entityType === "order") meta.dirtyOrderIds.add(p.entityId);
}

export function getStatsGeneration(): number {
  return meta.generation;
}

export function getStatsMeta(): Omit<
  StatsSnapshotMeta,
  "dirtyClientIds" | "dirtyProjectIds" | "dirtyOrderIds"
> & {
  dirtyClientIds: string[];
  dirtyProjectIds: string[];
  dirtyOrderIds: string[];
} {
  return {
    generation: meta.generation,
    lastEventId: meta.lastEventId,
    lastEventType: meta.lastEventType,
    lastOccurredAt: meta.lastOccurredAt,
    dashboardDirty: meta.dashboardDirty,
    dirtyClientIds: Array.from(meta.dirtyClientIds),
    dirtyProjectIds: Array.from(meta.dirtyProjectIds),
    dirtyOrderIds: Array.from(meta.dirtyOrderIds),
  };
}

export function clearStatsDirty(): void {
  meta.dirtyClientIds.clear();
  meta.dirtyProjectIds.clear();
  meta.dirtyOrderIds.clear();
  meta.dashboardDirty = false;
}

export function isDashboardDirty(): boolean {
  return meta.dashboardDirty;
}
