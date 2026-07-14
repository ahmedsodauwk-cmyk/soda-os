/**
 * Notification lifecycle helpers + smart sync from business state.
 * Presentation-layer only — does not change Mission 04.5 scope rules.
 */

import { getAssignmentById } from "@/lib/assignments/repository";
import {
  isUnread,
  lifecycleLabel,
} from "@/lib/core/notifications/lifecycle-labels";
import type {
  BusinessEvent,
  NotificationHistoryEntry,
  NotificationLifecycleStatus,
  NotificationRecord,
} from "@/lib/core/types";

export { isUnread, lifecycleLabel };

const STATUS_RANK: Record<NotificationLifecycleStatus, number> = {
  unread: 0,
  read: 1,
  acknowledged: 2,
  completed: 3,
};

export function statusRank(status: NotificationLifecycleStatus): number {
  return STATUS_RANK[status];
}

/** Advance only forward unless force. */
export function mergeLifecycleStatus(
  current: NotificationLifecycleStatus,
  next: NotificationLifecycleStatus,
  force = false
): NotificationLifecycleStatus {
  if (force) return next;
  return statusRank(next) >= statusRank(current) ? next : current;
}

export function appendHistory(
  history: NotificationHistoryEntry[] | undefined,
  entry: NotificationHistoryEntry
): NotificationHistoryEntry[] {
  const prev = history ?? [];
  const last = prev[prev.length - 1];
  if (last?.status === entry.status && last.at === entry.at) return prev;
  return [...prev, entry].slice(-20);
}

/**
 * Detect completion / ack from related business signals already in memory.
 * - CrewAssigned: assignment confirmed/cancelled → acknowledged/completed
 * - Open order signals: OrderCompleted / OrderCancelled on same order → completed
 * - Finance: InvoicePaid after InvoiceCreated (same invoice) → completed
 */
export function applySmartSync(
  notifications: NotificationRecord[],
  events: BusinessEvent[]
): NotificationRecord[] {
  const eventsByOrder = new Map<string, Set<string>>();
  const paidInvoices = new Set<string>();

  for (const e of events) {
    const orderId = e.payload.orderId ?? (e.payload.entityType === "order" ? e.payload.entityId : undefined);
    if (orderId) {
      const set = eventsByOrder.get(orderId) ?? new Set();
      set.add(e.type);
      eventsByOrder.set(orderId, set);
    }
    if (e.type === "InvoicePaid") {
      const inv =
        e.payload.invoiceId ??
        (e.payload.entityType === "invoice" ? e.payload.entityId : undefined);
      if (inv) paidInvoices.add(inv);
    }
  }

  const now = new Date().toISOString();

  return notifications.map((n) => {
    if (n.status === "completed" || n.dismissedAt || n.archivedAt) return n;

    // Crew confirm workflow
    if (n.eventType === "CrewAssigned" && n.requiresAck) {
      const assignmentId =
        n.actions?.find((a) => a.assignmentId)?.assignmentId ??
        (n.entityType === "assignment" ? n.entityId : undefined);
      if (assignmentId) {
        const assignment = getAssignmentById(assignmentId);
        const st = assignment?.assignmentStatus;
        if (st === "confirmed") {
          return withStatus(n, "acknowledged", now, "اتأكد التعيين من النظام");
        }
        if (st === "cancelled" || st === "completed" || st === "no_show") {
          return withStatus(n, "completed", now, "التعيين اتقفل");
        }
      }
    }

    const orderId =
      n.entityType === "order"
        ? n.entityId
        : n.relatedObjects?.find((r) => r.type === "order")?.id;
    if (orderId) {
      const types = eventsByOrder.get(orderId);
      if (
        types &&
        (types.has("OrderCompleted") || types.has("OrderCancelled")) &&
        (n.eventType === "OrderCreated" ||
          n.eventType === "OrderUpdated" ||
          n.eventType === "OrderConfirmed" ||
          n.eventType === "CrewAssigned" ||
          n.eventType === "OrderRescheduled")
      ) {
        return withStatus(n, "completed", now, "الأوردر اتقفل");
      }
      if (types?.has("DeliveryCompleted") && n.eventType === "DeliveryCreated") {
        return withStatus(n, "completed", now, "التسليم خلص");
      }
    }

    if (n.eventType === "InvoiceCreated") {
      const inv =
        n.entityType === "invoice"
          ? n.entityId
          : n.relatedObjects?.find((r) => r.type === "invoice")?.id;
      if (inv && paidInvoices.has(inv)) {
        return withStatus(n, "completed", now, "الفاتورة اتسددت");
      }
    }

    return n;
  });
}

function withStatus(
  n: NotificationRecord,
  status: NotificationLifecycleStatus,
  at: string,
  note: string
): NotificationRecord {
  const next = mergeLifecycleStatus(n.status, status);
  if (next === n.status && n.status !== "unread") {
    // still mark read if we only inferred ack
    return n;
  }
  return {
    ...n,
    status: next,
    read: next !== "unread",
    acknowledgedAt:
      next === "acknowledged" || next === "completed"
        ? (n.acknowledgedAt ?? at)
        : n.acknowledgedAt,
    completedAt: next === "completed" ? (n.completedAt ?? at) : n.completedAt,
    history: appendHistory(n.history, { at, status: next, note }),
  };
}

