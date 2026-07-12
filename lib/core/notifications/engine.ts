/**
 * Notification engine — real subscriber that records actionable notices
 * from business events (not mock/fake data).
 */

import type {
  BusinessEvent,
  BusinessEventType,
  NotificationAction,
  NotificationRecord,
} from "@/lib/core/types";
import { hrefForBusinessEvent } from "@/lib/identity/navigation";

const MAX_MEMORY = 500;
const notifications: NotificationRecord[] = [];

function hrefFor(event: BusinessEvent): string {
  try {
    return hrefForBusinessEvent(event);
  } catch {
    return "/notifications";
  }
}

const FRIENDLY_TITLES: Partial<Record<BusinessEventType, string>> = {
  ClientCreated: "New client",
  ClientUpdated: "Client updated",
  OrderCreated: "New order",
  OrderUpdated: "Order updated",
  OrderConfirmed: "Order confirmed",
  OrderCompleted: "Order completed",
  OrderCancelled: "Order cancelled",
  OrderRescheduled: "Order rescheduled",
  PaymentReceived: "Payment received",
  PaymentUpdated: "Payment updated",
  InvoiceCreated: "Invoice created",
  InvoicePaid: "Invoice paid",
  InvoiceUpdated: "Invoice updated",
  CrewAssigned: "Crew assigned",
  CrewRemoved: "Crew removed",
  CrewPaid: "Crew paid",
  CrewBonusGenerated: "Crew bonus",
  EquipmentAssigned: "Equipment assigned",
  EquipmentReturned: "Equipment returned",
  DeliveryCompleted: "Delivery completed",
  DeliveryCreated: "Delivery logged",
  ProjectCreated: "Project created",
  ProjectUpdated: "Project updated",
  QuotationConverted: "Quotation converted",
  FinancialReversed: "Finance update",
  FinancialVoided: "Finance update",
  FinancialCorrected: "Finance update",
  ExpenseRecorded: "Expense recorded",
  TransferCompleted: "Transfer completed",
  PeriodClosed: "Period closed",
  PeriodReopened: "Period reopened",
  OpeningBalancePosted: "Opening balance",
  ManualAdjustmentPosted: "Manual adjustment",
};

function humanizeEventType(type: string): string {
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}

function titleFor(event: BusinessEvent): string {
  return FRIENDLY_TITLES[event.type] ?? humanizeEventType(event.type);
}

function bodyFor(event: BusinessEvent): string {
  if (event.payload.summary?.trim()) return event.payload.summary.trim();
  const entity = event.payload.entityType;
  const id = event.payload.entityId;
  switch (event.type) {
    case "PaymentReceived":
    case "PaymentUpdated":
      return "A payment was recorded — open finance or the related order.";
    case "InvoiceCreated":
    case "InvoicePaid":
    case "InvoiceUpdated":
      return "Open finance to review invoices and balances.";
    case "OrderCreated":
    case "OrderUpdated":
    case "OrderConfirmed":
    case "OrderCompleted":
    case "OrderCancelled":
    case "OrderRescheduled":
      return "Open the order for full details.";
    case "ClientCreated":
    case "ClientUpdated":
      return "Open the client profile for related orders and projects.";
    case "ProjectCreated":
    case "ProjectUpdated":
      return "Open the project hub for orders, crew, and finance.";
    case "QuotationConverted":
      return "Open the quotation or related order to continue.";
    default:
      return `Related ${entity}${id ? ` · ${id}` : ""}`;
  }
}

/**
 * Scaffold only — Confirm/Decline are not enabled yet.
 * Keeps the shape ready for a future decision UI.
 */
function actionsFor(_event: BusinessEvent, href: string): NotificationAction[] {
  return [
    {
      kind: "view",
      label: "Open",
      href,
      enabled: true,
    },
    // Reserved for future Confirm / Decline — not rendered yet.
    { kind: "confirm", label: "Confirm", enabled: false },
    { kind: "decline", label: "Decline", enabled: false },
  ];
}

/** Record a notification from a business event (subscriber). */
export function recordNotificationFromEvent(event: BusinessEvent): void {
  const href = hrefFor(event);
  const record: NotificationRecord = {
    id: `ntf-${event.id}`,
    eventId: event.id,
    eventType: event.type,
    createdAt: event.occurredAt,
    title: titleFor(event),
    body: bodyFor(event),
    href,
    read: false,
    entityType: event.payload.entityType,
    entityId: event.payload.entityId,
    actions: actionsFor(event, href),
  };
  notifications.unshift(record);
  if (notifications.length > MAX_MEMORY) {
    notifications.length = MAX_MEMORY;
  }
}

export function listNotifications(limit = 50): NotificationRecord[] {
  return notifications.slice(0, Math.max(0, limit));
}

export function listUnreadNotifications(): NotificationRecord[] {
  return notifications.filter((n) => !n.read);
}

export function markNotificationRead(id: string): boolean {
  const n = notifications.find((x) => x.id === id);
  if (!n) return false;
  n.read = true;
  return true;
}

export function clearNotifications(): void {
  notifications.length = 0;
}

/** Rebuild in-memory notifications from persisted business events (serverless-safe). */
export function hydrateNotificationsFromEvents(
  events: BusinessEvent[],
  opts?: { clear?: boolean }
): NotificationRecord[] {
  if (opts?.clear !== false) {
    clearNotifications();
  }
  // Oldest first so unshift preserves newest-first order
  for (const event of [...events].reverse()) {
    try {
      recordNotificationFromEvent(event);
    } catch {
      // Never fail notification hydration — skip bad events
    }
  }
  return listNotifications();
}
