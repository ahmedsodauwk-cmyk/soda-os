/**
 * Order Operational Timeline — presentation mapper only.
 * Derives timeline items from already-loaded order + related data.
 * No business rules, mutations, or invented events.
 */

import type { OrderAssignment } from "@/lib/assignments/types";
import type { CalendarEvent } from "@/lib/calendar/types";
import type { BusinessEvent, BusinessEventType } from "@/lib/core/types";
import type { EquipmentAssignment } from "@/lib/equipment/types";
import type { FileAsset } from "@/lib/files/types";
import type { Expense } from "@/lib/finance/expenses";
import type { OrderDelivery } from "@/lib/invoices/types";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { formatPrice } from "@/lib/orders/utils";
import type { Payment } from "@/lib/payments/types";
import type { Person } from "@/lib/people/types";

/** Visual tone → status color in the timeline UI */
export type TimelineTone =
  | "neutral"
  | "info"
  | "brand"
  | "success"
  | "warning"
  | "danger";

export type TimelineIconKey =
  | "order"
  | "status"
  | "calendar"
  | "crew"
  | "payment"
  | "delivery"
  | "equipment"
  | "file"
  | "expense"
  | "activity";

/**
 * Extensible timeline item — new event sources map into this shape only.
 */
export interface TimelineItem {
  id: string;
  /** ISO timestamp used for chronological sort + display */
  occurredAt: string;
  title: string;
  description?: string;
  /** Display name, or "—" when unknown / not recorded */
  personLabel: string;
  tone: TimelineTone;
  icon: TimelineIconKey;
  /** Mapper source key — helps extend without redesign */
  source: string;
}

export interface OrderTimelineContext {
  order: Order;
  assignments: OrderAssignment[];
  payments: Payment[];
  deliveries: OrderDelivery[];
  calendar: CalendarEvent[];
  activity: BusinessEvent[];
  equipment: Array<EquipmentAssignment & { name?: string }>;
  files: FileAsset[];
  expenses: Expense[];
  peopleById: Record<string, Person>;
}

/** Registry entry — add a new mapper here to surface future event sources. */
export type TimelineSourceMapper = (
  ctx: OrderTimelineContext
) => TimelineItem[];

const ABSENT = "—";

function personLabel(
  peopleById: Record<string, Person>,
  personId: string | undefined | null
): string {
  if (!personId) return ABSENT;
  const p = peopleById[personId];
  if (!p) return ABSENT;
  return p.nickname || p.nameEn || p.nameAr || ABSENT;
}

/** Normalize date-only strings to a stable ISO midday UTC for sorting/display. */
function dateOnlyToIso(dateStr: string): string | null {
  const raw = dateStr?.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T12:00:00.000Z`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function sortChronological(items: TimelineItem[]): TimelineItem[] {
  return [...items].sort((a, b) => {
    const ta = new Date(a.occurredAt).getTime();
    const tb = new Date(b.occurredAt).getTime();
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });
}

const STATUS_TONE: Record<OrderStatus, TimelineTone> = {
  Holding: "neutral",
  Confirmed: "info",
  Pending: "neutral",
  Scheduled: "info",
  Shooting: "brand",
  Editing: "warning",
  Completed: "success",
  Delivered: "success",
  Cancelled: "danger",
};

const BUSINESS_EVENT_META: Partial<
  Record<
    BusinessEventType,
    { title: string; tone: TimelineTone; icon: TimelineIconKey }
  >
> = {
  OrderCreated: { title: "Order created", tone: "brand", icon: "order" },
  OrderUpdated: { title: "Order updated", tone: "neutral", icon: "status" },
  OrderConfirmed: { title: "Order confirmed", tone: "info", icon: "status" },
  OrderCompleted: { title: "Order completed", tone: "success", icon: "status" },
  OrderCancelled: { title: "Order cancelled", tone: "danger", icon: "status" },
  OrderRescheduled: {
    title: "Order rescheduled",
    tone: "warning",
    icon: "calendar",
  },
  PaymentReceived: {
    title: "Payment received",
    tone: "success",
    icon: "payment",
  },
  PaymentUpdated: {
    title: "Payment updated",
    tone: "info",
    icon: "payment",
  },
  CrewAssigned: { title: "Crew assigned", tone: "brand", icon: "crew" },
  CrewRemoved: { title: "Crew removed", tone: "warning", icon: "crew" },
  CrewPaid: { title: "Crew paid", tone: "success", icon: "payment" },
  CrewBonusGenerated: {
    title: "Crew bonus generated",
    tone: "success",
    icon: "crew",
  },
  EquipmentAssigned: {
    title: "Equipment assigned",
    tone: "info",
    icon: "equipment",
  },
  EquipmentReturned: {
    title: "Equipment returned",
    tone: "neutral",
    icon: "equipment",
  },
  DeliveryCreated: {
    title: "Delivery recorded",
    tone: "info",
    icon: "delivery",
  },
  DeliveryCompleted: {
    title: "Delivery completed",
    tone: "success",
    icon: "delivery",
  },
  ExpenseRecorded: {
    title: "Expense recorded",
    tone: "warning",
    icon: "expense",
  },
  InvoiceCreated: { title: "Invoice created", tone: "info", icon: "payment" },
  InvoicePaid: { title: "Invoice paid", tone: "success", icon: "payment" },
  InvoiceUpdated: { title: "Invoice updated", tone: "info", icon: "payment" },
  QuotationConverted: {
    title: "Quotation converted",
    tone: "brand",
    icon: "order",
  },
};

/** Milestones from order date fields only — never invents status transitions. */
const mapOrderFieldMilestones: TimelineSourceMapper = ({
  order,
  calendar,
}) => {
  const items: TimelineItem[] = [];

  const shootIso = dateOnlyToIso(order.shootDate);
  const hasCalendarShootSameDay =
    Boolean(order.shootDate) &&
    calendar.some(
      (ev) =>
        ev.kind === "shoot" &&
        (ev.startsAt.slice(0, 10) === order.shootDate.trim() ||
          dateOnlyToIso(ev.startsAt)?.slice(0, 10) ===
            order.shootDate.trim())
    );
  if (shootIso && !hasCalendarShootSameDay) {
    items.push({
      id: `order-field:shoot:${order.id}`,
      occurredAt: shootIso,
      title: "Shoot scheduled",
      description: order.location
        ? `Shoot date on record · ${order.location}`
        : "Shoot date on record",
      personLabel: ABSENT,
      tone: "brand",
      icon: "calendar",
      source: "order.shootDate",
    });
  }

  const deliveryIso = dateOnlyToIso(order.deliveryDate);
  if (deliveryIso) {
    items.push({
      id: `order-field:delivery:${order.id}`,
      occurredAt: deliveryIso,
      title: "Delivery date set",
      description: "Planned delivery date on record",
      personLabel: ABSENT,
      tone: "info",
      icon: "delivery",
      source: "order.deliveryDate",
    });
  }

  return items;
};

/**
 * Current status snapshot — only when no status business events exist.
 * Uses shoot date when present so we never invent a transition timestamp;
 * otherwise omitted (status remains visible on the page badge).
 */
const mapCurrentStatusSnapshot: TimelineSourceMapper = ({
  order,
  activity,
}) => {
  const hasStatusEvent = activity.some((ev) =>
    [
      "OrderCreated",
      "OrderUpdated",
      "OrderConfirmed",
      "OrderCompleted",
      "OrderCancelled",
      "OrderRescheduled",
    ].includes(ev.type)
  );
  if (hasStatusEvent) return [];

  const anchor =
    dateOnlyToIso(order.shootDate) ?? dateOnlyToIso(order.deliveryDate);
  if (!anchor) return [];

  return [
    {
      id: `order-field:status-snapshot:${order.id}`,
      occurredAt: anchor,
      title: `Status · ${order.status}`,
      description:
        "Current status on record (transition history not yet stored)",
      personLabel: ABSENT,
      tone: STATUS_TONE[order.status] ?? "neutral",
      icon: "status",
      source: "order.status",
    },
  ];
};

const mapAssignments: TimelineSourceMapper = ({
  assignments,
  peopleById,
}) => {
  const items: TimelineItem[] = [];

  for (const a of assignments) {
    const who = personLabel(peopleById, a.personId);
    const createdIso = dateOnlyToIso(a.createdAt);
    if (createdIso) {
      items.push({
        id: `assignment:created:${a.id}`,
        occurredAt: createdIso,
        title: "Crew assigned",
        description: `${a.role}${a.assignmentStatus ? ` · ${a.assignmentStatus.replace("_", " ")}` : ""}`,
        personLabel: who,
        tone: "brand",
        icon: "crew",
        source: "assignment.createdAt",
      });
    }

    if (a.paidAt && a.paidAmount > 0) {
      const paidIso = dateOnlyToIso(a.paidAt);
      if (paidIso) {
        items.push({
          id: `assignment:paid:${a.id}`,
          occurredAt: paidIso,
          title: "Crew payment",
          description: formatPrice(a.paidAmount),
          personLabel: who,
          tone: "success",
          icon: "payment",
          source: "assignment.paidAt",
        });
      }
    }
  }

  return items;
};

const mapPayments: TimelineSourceMapper = ({ payments }) => {
  const items: TimelineItem[] = [];

  for (const p of payments) {
    const paidIso = p.paidAt ? dateOnlyToIso(p.paidAt) : null;
    if (!paidIso) continue;

    const label = p.label || p.kind;
    const method = p.method ? ` · ${p.method}` : "";
    items.push({
      id: `payment:${p.id}`,
      occurredAt: paidIso,
      title:
        p.status === "paid"
          ? "Payment received"
          : `Payment · ${p.status}`,
      description: `${label} · ${formatPrice(p.amount)}${method}`,
      personLabel: p.receiver?.trim() || ABSENT,
      tone:
        p.status === "paid"
          ? "success"
          : p.status === "failed" || p.status === "voided"
            ? "danger"
            : "info",
      icon: "payment",
      source: "payment.paidAt",
    });
  }

  return items;
};

const mapDeliveries: TimelineSourceMapper = ({ deliveries }) => {
  const items: TimelineItem[] = [];

  for (const d of deliveries) {
    if (d.deliveredAt) {
      const iso = dateOnlyToIso(d.deliveredAt);
      if (iso) {
        items.push({
          id: `delivery:done:${d.id}`,
          occurredAt: iso,
          title: "Delivery completed",
          description: d.label || d.status,
          personLabel: ABSENT,
          tone: "success",
          icon: "delivery",
          source: "delivery.deliveredAt",
        });
      }
      continue;
    }

    const dueIso = dateOnlyToIso(d.dueDate);
    if (dueIso) {
      items.push({
        id: `delivery:due:${d.id}`,
        occurredAt: dueIso,
        title: "Delivery due",
        description: `${d.label || "Delivery"} · ${d.status}`,
        personLabel: ABSENT,
        tone: d.status === "pending" ? "warning" : "info",
        icon: "delivery",
        source: "delivery.dueDate",
      });
    }
  }

  return items;
};

const mapCalendar: TimelineSourceMapper = ({ calendar }) =>
  calendar
    .map((ev) => {
      const iso = dateOnlyToIso(ev.startsAt);
      if (!iso) return null;
      return {
        id: `calendar:${ev.id}`,
        occurredAt: iso,
        title: ev.title || `Calendar · ${ev.kind}`,
        description: ev.location
          ? `${ev.kind} · ${ev.location}`
          : `Calendar event · ${ev.kind}`,
        personLabel: ABSENT,
        tone: ev.kind === "shoot" ? "brand" : "info",
        icon: "calendar" as const,
        source: "calendar.startsAt",
      } satisfies TimelineItem;
    })
    .filter((x): x is TimelineItem => x != null);

const mapEquipment: TimelineSourceMapper = ({ equipment, peopleById }) => {
  const items: TimelineItem[] = [];

  for (const eq of equipment) {
    const assignedIso = dateOnlyToIso(eq.assignedAt);
    if (assignedIso) {
      items.push({
        id: `equipment:assigned:${eq.id}`,
        occurredAt: assignedIso,
        title: "Equipment assigned",
        description: eq.name || eq.equipmentId,
        personLabel: personLabel(peopleById, eq.personId),
        tone: "info",
        icon: "equipment",
        source: "equipment.assignedAt",
      });
    }
    if (eq.returnedAt) {
      const returnedIso = dateOnlyToIso(eq.returnedAt);
      if (returnedIso) {
        items.push({
          id: `equipment:returned:${eq.id}`,
          occurredAt: returnedIso,
          title: "Equipment returned",
          description: eq.name || eq.equipmentId,
          personLabel: personLabel(peopleById, eq.personId),
          tone: "neutral",
          icon: "equipment",
          source: "equipment.returnedAt",
        });
      }
    }
  }

  return items;
};

const mapFiles: TimelineSourceMapper = ({ files }) =>
  files
    .map((f) => {
      const iso = dateOnlyToIso(f.updatedAt);
      if (!iso) return null;
      return {
        id: `file:${f.id}`,
        occurredAt: iso,
        title: "File linked",
        description: f.name,
        personLabel: ABSENT,
        tone: "neutral" as const,
        icon: "file" as const,
        source: "file.updatedAt",
      } satisfies TimelineItem;
    })
    .filter((x): x is TimelineItem => x != null);

const mapExpenses: TimelineSourceMapper = ({ expenses }) =>
  expenses
    .filter((e) => e.status !== "voided")
    .map((e) => {
      const iso =
        dateOnlyToIso(e.expenseDate) ?? dateOnlyToIso(e.createdAt);
      if (!iso) return null;
      return {
        id: `expense:${e.id}`,
        occurredAt: iso,
        title: "Expense recorded",
        description: `${e.category} · ${formatPrice(e.amount)}`,
        personLabel: ABSENT,
        tone: "warning" as const,
        icon: "expense" as const,
        source: "expense.expenseDate",
      } satisfies TimelineItem;
    })
    .filter((x): x is TimelineItem => x != null);

/**
 * Prefer business events when present — they carry real occurredAt.
 * Skip types we already surface from entity rows when the event would duplicate
 * the same entity id (payments/assignments/etc. keep entity mappers as primary).
 */
const mapBusinessActivity: TimelineSourceMapper = ({
  activity,
  peopleById,
}) => {
  const ENTITY_PRIMARY = new Set<BusinessEventType>([
    "PaymentReceived",
    "PaymentUpdated",
    "CrewAssigned",
    "CrewPaid",
    "EquipmentAssigned",
    "EquipmentReturned",
    "DeliveryCreated",
    "DeliveryCompleted",
    "ExpenseRecorded",
  ]);

  return activity
    .filter((ev) => !ENTITY_PRIMARY.has(ev.type))
    .map((ev) => {
      const iso = dateOnlyToIso(ev.occurredAt);
      if (!iso) return null;
      const meta = BUSINESS_EVENT_META[ev.type] ?? {
        title: ev.type.replace(/([A-Z])/g, " $1").trim(),
        tone: "neutral" as TimelineTone,
        icon: "activity" as TimelineIconKey,
      };
      const summary = ev.payload.summary?.trim();
      const who = personLabel(peopleById, ev.payload.personId);
      return {
        id: `activity:${ev.id}`,
        occurredAt: iso,
        title: meta.title,
        description: summary || undefined,
        personLabel: who,
        tone: meta.tone,
        icon: meta.icon,
        source: `business_event.${ev.type}`,
      } satisfies TimelineItem;
    })
    .filter((x): x is TimelineItem => x != null);
};

/**
 * Ordered registry — append new mappers here; UI stays unchanged.
 * Entity rows are preferred for money/crew/equipment; business events fill gaps.
 */
export const ORDER_TIMELINE_SOURCES: TimelineSourceMapper[] = [
  mapOrderFieldMilestones,
  mapCurrentStatusSnapshot,
  mapAssignments,
  mapPayments,
  mapDeliveries,
  mapCalendar,
  mapEquipment,
  mapFiles,
  mapExpenses,
  mapBusinessActivity,
];

/** Pure adapter: context → chronological timeline items. */
export function buildOrderTimeline(
  ctx: OrderTimelineContext,
  sources: TimelineSourceMapper[] = ORDER_TIMELINE_SOURCES
): TimelineItem[] {
  const seen = new Set<string>();
  const items: TimelineItem[] = [];

  for (const map of sources) {
    for (const item of map(ctx)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }

  return sortChronological(items);
}
