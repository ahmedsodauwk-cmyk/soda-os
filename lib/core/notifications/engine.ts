/**
 * Notification engine — real subscriber that records actionable notices
 * from business events (not mock/fake data).
 */

import type { BusinessEvent, NotificationRecord } from "@/lib/core/types";

const MAX_MEMORY = 500;
const notifications: NotificationRecord[] = [];

function hrefFor(event: BusinessEvent): string | undefined {
  const p = event.payload;
  if (p.orderId) return `/orders/${p.orderId}`;
  if (p.clientId) return `/clients/${p.clientId}`;
  if (p.projectId) return `/projects/${p.projectId}`;
  if (p.personId) return `/crew/${p.personId}`;
  if (p.invoiceId) return `/finance`;
  return undefined;
}

function titleFor(event: BusinessEvent): string {
  switch (event.type) {
    case "ClientCreated":
      return "New client";
    case "ClientUpdated":
      return "Client updated";
    case "OrderCreated":
      return "Order created";
    case "OrderConfirmed":
      return "Order confirmed";
    case "OrderCompleted":
      return "Order completed";
    case "OrderCancelled":
      return "Order cancelled";
    case "PaymentReceived":
      return "Payment received";
    case "InvoiceCreated":
      return "Invoice created";
    case "InvoicePaid":
      return "Invoice paid";
    case "CrewAssigned":
      return "Crew assigned";
    case "CrewRemoved":
      return "Crew removed";
    case "CrewPaid":
      return "Crew paid";
    case "EquipmentAssigned":
      return "Equipment assigned";
    case "EquipmentReturned":
      return "Equipment returned";
    case "DeliveryCompleted":
    case "DeliveryCreated":
      return "Delivery logged";
    case "ProjectCreated":
      return "Project created";
    case "QuotationConverted":
      return "Quotation converted";
    default:
      return event.type;
  }
}

/** Record a notification from a business event (subscriber). */
export function recordNotificationFromEvent(event: BusinessEvent): void {
  const record: NotificationRecord = {
    id: `ntf-${event.id}`,
    eventId: event.id,
    eventType: event.type,
    createdAt: event.occurredAt,
    title: titleFor(event),
    body:
      event.payload.summary ??
      `${event.type} on ${event.payload.entityType} ${event.payload.entityId}`,
    href: hrefFor(event),
    read: false,
    entityType: event.payload.entityType,
    entityId: event.payload.entityId,
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
