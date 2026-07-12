/**
 * Notification engine — real subscriber that records actionable notices
 * from business events (Egyptian Arabic, never developer event names).
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

const FRIENDLY_TITLES_AR: Partial<Record<BusinessEventType, string>> = {
  ClientCreated: "عميل جديد اتضاف",
  ClientUpdated: "تحديث على عميل",
  OrderCreated: "أوردر جديد",
  OrderUpdated: "تحديث على أوردر",
  OrderConfirmed: "أوردر اتأكد",
  OrderCompleted: "أوردر اتخلّص",
  OrderCancelled: "أوردر اتلغى",
  OrderRescheduled: "أوردر اتغيّر معادُه",
  PaymentReceived: "دفعة دخلت",
  PaymentUpdated: "تحديث على دفعة",
  InvoiceCreated: "فاتورة جديدة",
  InvoicePaid: "فاتورة اتسددت",
  InvoiceUpdated: "تحديث على فاتورة",
  CrewAssigned: "تعيين في الفريق",
  CrewRemoved: "حد اتشال من التعيين",
  CrewPaid: "صرف للفريق",
  CrewBonusGenerated: "بونص للفريق",
  EquipmentAssigned: "معدة اتسلّمت",
  EquipmentReturned: "معدة رجعت",
  DeliveryCompleted: "تسليم خلص",
  DeliveryCreated: "تسليم اتسجّل",
  ProjectCreated: "مشروع جديد",
  ProjectUpdated: "تحديث على مشروع",
  QuotationConverted: "عرض سعر اتحول لأوردر",
  FinancialReversed: "حركة مالية اترجعت",
  FinancialVoided: "حركة مالية اتلغت",
  FinancialCorrected: "تصحيح مالي",
  ExpenseRecorded: "مصروف اتسجّل",
  TransferCompleted: "تحويل خلص",
  PeriodClosed: "فترة اتقفلت",
  PeriodReopened: "فترة اتفتحت تاني",
  OpeningBalancePosted: "رصيد افتتاحي",
  ManualAdjustmentPosted: "تعديل يدوي",
};

function titleFor(event: BusinessEvent): string {
  return (
    FRIENDLY_TITLES_AR[event.type] ?? "حركة جديدة في الستوديو"
  );
}

function bodyFor(event: BusinessEvent): string {
  if (event.payload.summary?.trim()) return event.payload.summary.trim();
  switch (event.type) {
    case "PaymentReceived":
    case "PaymentUpdated":
    case "InvoiceCreated":
    case "InvoicePaid":
    case "InvoiceUpdated":
    case "ExpenseRecorded":
    case "TransferCompleted":
    case "FinancialReversed":
    case "FinancialVoided":
    case "FinancialCorrected":
    case "OpeningBalancePosted":
    case "ManualAdjustmentPosted":
    case "PeriodClosed":
    case "PeriodReopened":
      return "شوف التفاصيل في المالية.";
    case "OrderCreated":
    case "OrderUpdated":
    case "OrderConfirmed":
    case "OrderCompleted":
    case "OrderCancelled":
    case "OrderRescheduled":
    case "DeliveryCompleted":
    case "DeliveryCreated":
    case "CrewAssigned":
    case "CrewRemoved":
    case "EquipmentAssigned":
    case "EquipmentReturned":
      return "افتح الأوردر وشوف التفاصيل.";
    case "ClientCreated":
    case "ClientUpdated":
      return "افتح ملف العميل.";
    case "ProjectCreated":
    case "ProjectUpdated":
      return "افتح المشروع.";
    case "QuotationConverted":
      return "العرض اتحول — كمّل من الأوردر.";
    case "CrewPaid":
    case "CrewBonusGenerated":
      return "شوف الصرف في المالية.";
    default:
      return "فيه تحديث محتاج نظرة.";
  }
}

type ActionKind = "order" | "client" | "finance" | "project" | "generic";

function actionKindFor(event: BusinessEvent, href: string): ActionKind {
  if (href.startsWith("/finance") || event.payload.entityType === "invoice" || event.payload.entityType === "payment") {
    return "finance";
  }
  if (href.startsWith("/orders") || event.payload.entityType === "order" || event.payload.orderId) {
    return "order";
  }
  if (href.startsWith("/clients") || event.payload.entityType === "client" || event.payload.clientId) {
    return "client";
  }
  if (href.startsWith("/projects") || event.payload.entityType === "project") {
    return "project";
  }
  const financeTypes = new Set([
    "PaymentReceived",
    "PaymentUpdated",
    "InvoiceCreated",
    "InvoicePaid",
    "InvoiceUpdated",
    "CrewPaid",
    "ExpenseRecorded",
    "TransferCompleted",
    "FinancialReversed",
    "FinancialVoided",
    "FinancialCorrected",
    "PeriodClosed",
    "PeriodReopened",
    "OpeningBalancePosted",
    "ManualAdjustmentPosted",
  ]);
  if (financeTypes.has(event.type)) return "finance";
  return "generic";
}

function actionLabel(kind: ActionKind): string {
  switch (kind) {
    case "order":
      return "افتح الأوردر";
    case "client":
      return "افتح العميل";
    case "finance":
      return "افتح المالية";
    case "project":
      return "افتح المشروع";
    default:
      return "افتح التفاصيل";
  }
}

function actionsFor(event: BusinessEvent, href: string): NotificationAction[] {
  const kind = actionKindFor(event, href);
  return [
    {
      kind: "view",
      label: actionLabel(kind),
      href,
      enabled: true,
    },
    { kind: "confirm", label: "تأكيد", enabled: false },
    { kind: "decline", label: "رفض", enabled: false },
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
  for (const event of [...events].reverse()) {
    try {
      recordNotificationFromEvent(event);
    } catch {
      // Never fail notification hydration — skip bad events
    }
  }
  return listNotifications();
}

/** Resolve human action label for UI (header + center). */
export function notificationActionLabel(
  item: NotificationRecord
): string {
  const view = item.actions?.find((a) => a.kind === "view" && a.enabled !== false);
  if (view?.label) return view.label;
  const href = item.href ?? "";
  if (href.startsWith("/orders")) return "افتح الأوردر";
  if (href.startsWith("/clients")) return "افتح العميل";
  if (href.startsWith("/finance")) return "افتح المالية";
  if (href.startsWith("/projects")) return "افتح المشروع";
  return "افتح التفاصيل";
}
