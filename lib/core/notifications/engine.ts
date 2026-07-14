/**
 * Human Notification Layer — Business Events → Human Language → Priority → Center.
 * Never exposes raw PascalCase event names to the UI.
 */

import type {
  BusinessEvent,
  BusinessEventType,
  NotificationAction,
  NotificationRecord,
  NotificationRelatedObject,
} from "@/lib/core/types";
import { hrefForBusinessEvent } from "@/lib/identity/navigation";
import { categoryForEvent } from "@/lib/core/notifications/categories";
import {
  compareNotificationsByPriority,
  priorityForEvent,
} from "@/lib/core/notifications/priority";

const MAX_MEMORY = 500;
const notifications: NotificationRecord[] = [];

function hrefFor(event: BusinessEvent): string {
  try {
    return hrefForBusinessEvent(event);
  } catch {
    return "/notifications";
  }
}

/**
 * Human titles — Egyptian Arabic teammate voice.
 * Maps mission examples onto existing Business Core events
 * (OrderAssigned → OrderCreated / CrewAssigned; CrewConfirmed → CrewAssigned).
 */
const FRIENDLY_TITLES_AR: Partial<Record<BusinessEventType, string>> = {
  ClientCreated: "عميل جديد انضم",
  ClientUpdated: "تحديث على عميل",
  OrderCreated: "أوردر جديد وصل",
  OrderUpdated: "تحديث على أوردر",
  OrderConfirmed: "أوردر اتأكد",
  OrderCompleted: "أوردر اتخلّص",
  OrderCancelled: "أوردر اتلغى",
  OrderRescheduled: "أوردر اتغيّر معادُه",
  PaymentReceived: "تحصيل جديد دخل",
  PaymentUpdated: "تحديث على دفعة",
  InvoiceCreated: "فاتورة جديدة",
  InvoicePaid: "فاتورة اتسددت",
  InvoiceUpdated: "تحديث على فاتورة",
  CrewAssigned: "تعيين محتاج تأكيدك",
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
  return FRIENDLY_TITLES_AR[event.type] ?? "تحديث من الستوديو";
}

/** Reject Latin / PascalCase / English ops copy — UI is Arabic-only. */
function isNonHumanSummary(raw: string): boolean {
  if (/[A-Za-z]{3,}/.test(raw)) return true;
  if (/^[A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)+/.test(raw)) return true;
  return false;
}

function humanSummary(event: BusinessEvent): string | null {
  const raw = event.payload.summary?.trim();
  if (!raw) return null;
  // Known English payloads → Arabic (never surface raw summary)
  if (/^Crew assigned to order/i.test(raw)) {
    return "فيه تعيين جديد على أوردر — أكّد أو ارفض من هنا.";
  }
  if (/^Order confirmed/i.test(raw)) {
    return "الأوردر اتأكد — افتحه وشوف التفاصيل.";
  }
  if (/^Client payment/i.test(raw)) {
    return "فلوس دخلت الخزنة — شوف التفاصيل في المالية.";
  }
  if (isNonHumanSummary(raw)) return null;
  return raw;
}

function bodyFor(event: BusinessEvent): string {
  const summary = humanSummary(event);
  if (summary) return summary;

  switch (event.type) {
    case "PaymentReceived":
      return "فلوس دخلت الخزنة — شوف التفاصيل في المالية.";
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
      return "أوردر جديد دخل النظام — افتحه ورتّب الخطوة الجاية.";
    case "CrewAssigned":
      return "تعيين جديد على أوردر — أكّد الحضور أو ارفض التعيين.";
    case "OrderUpdated":
    case "OrderConfirmed":
    case "OrderCompleted":
    case "OrderCancelled":
    case "OrderRescheduled":
    case "DeliveryCompleted":
    case "DeliveryCreated":
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
  if (
    href.startsWith("/finance") ||
    event.payload.entityType === "invoice" ||
    event.payload.entityType === "payment"
  ) {
    return "finance";
  }
  if (
    href.startsWith("/orders") ||
    event.payload.entityType === "order" ||
    event.payload.orderId
  ) {
    return "order";
  }
  if (
    href.startsWith("/clients") ||
    event.payload.entityType === "client" ||
    event.payload.clientId
  ) {
    return "client";
  }
  if (
    href.startsWith("/projects") ||
    event.payload.entityType === "project"
  ) {
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

function relatedObjectsFor(
  event: BusinessEvent,
  href: string
): NotificationRelatedObject[] {
  const related: NotificationRelatedObject[] = [];
  const p = event.payload;
  if (p.orderId) {
    related.push({
      type: "order",
      id: p.orderId,
      label: "الأوردر",
      href: `/orders/${p.orderId}`,
    });
  }
  if (p.clientId) {
    related.push({
      type: "client",
      id: p.clientId,
      label: "العميل",
      href: `/clients/${p.clientId}`,
    });
  }
  if (p.projectId) {
    related.push({
      type: "project",
      id: p.projectId,
      label: "المشروع",
      href: `/projects/${p.projectId}`,
    });
  }
  if (p.personId) {
    related.push({
      type: "person",
      id: p.personId,
      label: "فرد الفريق",
      href: `/people/${p.personId}`,
    });
  }
  if (p.quotationId) {
    related.push({
      type: "quotation",
      id: p.quotationId,
      label: "عرض السعر",
      href: `/quotations/${p.quotationId}`,
    });
  }
  if (
    p.invoiceId ||
    p.paymentId ||
    actionKindFor(event, href) === "finance"
  ) {
    related.push({
      type: "finance",
      id: p.invoiceId ?? p.paymentId,
      label: "المالية",
      href: "/finance",
    });
  }
  if (event.type === "OrderRescheduled") {
    related.push({
      type: "calendar",
      label: "التقويم",
      href: "/calendar",
    });
  }
  // Dedupe by href
  const seen = new Set<string>();
  return related.filter((r) => {
    if (seen.has(r.href)) return false;
    seen.add(r.href);
    return true;
  });
}

function actionsFor(event: BusinessEvent, href: string): NotificationAction[] {
  const kind = actionKindFor(event, href);
  const open: NotificationAction = {
    kind: kind === "order" ? "view_order" : "open",
    label: actionLabel(kind),
    href,
    enabled: true,
  };
  const navigate: NotificationAction = {
    kind: "navigate",
    label: "روح للمكان",
    href,
    enabled: true,
  };
  const dismiss: NotificationAction = {
    kind: "dismiss",
    label: "تجاهل",
    enabled: true,
  };

  // CrewAssigned — Accept workflow (Confirm/Decline via existing assignment API).
  if (event.type === "CrewAssigned") {
    const assignmentId =
      event.payload.assignmentId ??
      (event.payload.entityType === "assignment"
        ? event.payload.entityId
        : undefined);
    const actions: NotificationAction[] = [
      open,
      {
        kind: "accept",
        label: "قبول",
        enabled: Boolean(assignmentId),
        assignmentId,
        href,
      },
      {
        kind: "reject",
        label: "رفض",
        enabled: Boolean(assignmentId),
        assignmentId,
        href,
      },
      {
        kind: "confirm",
        label: "تأكيد",
        enabled: Boolean(assignmentId),
        assignmentId,
        href,
      },
      {
        kind: "decline",
        label: "رفض التعيين",
        enabled: Boolean(assignmentId),
        assignmentId,
        href,
      },
    ];
    if (event.payload.orderId) {
      actions.push({
        kind: "assign_crew",
        label: "تعيين فريق",
        href: `/orders/${event.payload.orderId}`,
        enabled: true,
      });
    }
    actions.push(dismiss);
    return actions;
  }

  const actions: NotificationAction[] = [open, navigate];

  if (kind === "order" && event.payload.orderId) {
    actions.push({
      kind: "view_order",
      label: "افتح الأوردر",
      href: `/orders/${event.payload.orderId}`,
      enabled: true,
    });
    actions.push({
      kind: "assign_crew",
      label: "تعيين فريق",
      href: `/orders/${event.payload.orderId}`,
      enabled: true,
    });
  }

  // Navigate-only placeholders — Mark Paid / Delivered need existing order page flows.
  if (event.type === "PaymentReceived" || event.type === "InvoiceCreated") {
    actions.push({
      kind: "mark_paid",
      label: "شوف التحصيل",
      href: event.payload.orderId
        ? `/orders/${event.payload.orderId}`
        : "/finance",
      enabled: true,
    });
  }
  if (event.type === "DeliveryCreated" || event.type === "OrderConfirmed") {
    actions.push({
      kind: "mark_delivered",
      label: "تابع التسليم",
      href: event.payload.orderId
        ? `/orders/${event.payload.orderId}`
        : href,
      enabled: true,
    });
  }

  if (event.payload.personId) {
    actions.push({
      kind: "call",
      label: "ملف الفرد",
      href: `/people/${event.payload.personId}`,
      enabled: true,
    });
  }

  actions.push(dismiss);
  return actions;
}

/** Pure map: business event → human notification (no shared cache mutation). */
export function buildNotificationRecord(
  event: BusinessEvent
): NotificationRecord {
  const href = hrefFor(event);
  const requiresAck = event.type === "CrewAssigned";
  return {
    id: `ntf-${event.id}`,
    eventId: event.id,
    eventType: event.type,
    createdAt: event.occurredAt,
    title: titleFor(event),
    body: bodyFor(event),
    href,
    read: false,
    status: "unread",
    category: categoryForEvent(event),
    entityType: event.payload.entityType,
    entityId: event.payload.entityId,
    priority: priorityForEvent(event),
    requiresAck,
    relatedObjects: relatedObjectsFor(event, href),
    history: [
      {
        at: event.occurredAt,
        status: "unread",
        note: "اتعمل التنبيه",
      },
    ],
    actions: actionsFor(event, href),
  };
}

/**
 * Map events → notifications without touching the process-global store.
 * Use for scoped session loads (avoids cross-user cache bleed on warm serverless).
 */
export function mapEventsToNotifications(
  events: BusinessEvent[],
  limit = 50
): NotificationRecord[] {
  const mapped: NotificationRecord[] = [];
  for (const event of [...events].reverse()) {
    try {
      mapped.unshift(buildNotificationRecord(event));
    } catch {
      // Never fail notification mapping — skip bad events
    }
  }
  return mapped
    .sort(compareNotificationsByPriority)
    .slice(0, Math.max(0, limit));
}

/** Record a human notification from a business event (subscriber). */
export function recordNotificationFromEvent(event: BusinessEvent): void {
  const record = buildNotificationRecord(event);
  notifications.unshift(record);
  if (notifications.length > MAX_MEMORY) {
    notifications.length = MAX_MEMORY;
  }
}

export function listNotifications(limit = 50): NotificationRecord[] {
  return [...notifications]
    .sort(compareNotificationsByPriority)
    .slice(0, Math.max(0, limit));
}

export function listUnreadNotifications(): NotificationRecord[] {
  return listNotifications().filter((n) => !n.read);
}

export function markNotificationRead(id: string): boolean {
  const n = notifications.find((x) => x.id === id);
  if (!n) return false;
  n.read = true;
  if (n.status === "unread") n.status = "read";
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
export function notificationActionLabel(item: NotificationRecord): string {
  const view = item.actions?.find(
    (a) => a.kind === "view" && a.enabled !== false
  );
  if (view?.label) return view.label;
  const href = item.href ?? "";
  if (href.startsWith("/orders")) return "افتح الأوردر";
  if (href.startsWith("/clients")) return "افتح العميل";
  if (href.startsWith("/finance")) return "افتح المالية";
  if (href.startsWith("/projects")) return "افتح المشروع";
  return "افتح التفاصيل";
}

export function notificationPriorityLabel(
  priority: NotificationRecord["priority"]
): string {
  switch (priority) {
    case "urgent":
      return "حرج";
    case "high":
      return "عالي";
    case "normal":
      return "عادي";
    case "low":
      return "معلومة";
    default:
      return "";
  }
}

/** Visual tier labels matching Mission priority: Critical / High / Normal / Info */
export function notificationPriorityTier(
  priority: NotificationRecord["priority"]
): "critical" | "high" | "normal" | "info" {
  switch (priority) {
    case "urgent":
      return "critical";
    case "high":
      return "high";
    case "low":
      return "info";
    default:
      return "normal";
  }
}

/**
 * ONE display mapper for bell + notifications page.
 * Never surfaces PascalCase event names or English payload leftovers.
 */
export function notificationDisplayTitle(item: NotificationRecord): string {
  const t = item.title?.trim();
  if (t && !isNonHumanSummary(t)) return t;
  return FRIENDLY_TITLES_AR[item.eventType] ?? "تحديث من الستوديو";
}

export function notificationDisplayBody(item: NotificationRecord): string {
  const b = item.body?.trim();
  if (b && !isNonHumanSummary(b)) return b;
  return notificationActionLabel(item);
}

export function notificationHref(item: NotificationRecord): string {
  if (item.href?.startsWith("/")) return item.href;
  switch (item.entityType) {
    case "order":
      return `/orders/${item.entityId}`;
    case "client":
      return `/clients/${item.entityId}`;
    case "project":
      return `/projects/${item.entityId}`;
    case "person":
      return `/crew/${item.entityId}`;
    case "payment":
    case "invoice":
      return "/finance";
    case "quotation":
      return `/quotations/${item.entityId}`;
    default:
      return "/notifications";
  }
}
