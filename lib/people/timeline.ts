/**
 * Crew Workspace operational timeline — real business events only.
 */

import {
  listBusinessEvents,
  type BusinessEvent,
  type BusinessEventType,
} from "@/lib/core";
import type { Person } from "@/lib/people/types";
import { getAssignmentsByPerson } from "@/lib/assignments/repository";
import { getOrderById } from "@/lib/orders/repository";
import { isOrderCompleted } from "@/lib/orders/status";

export type CrewTimelineKind =
  | "assigned_order"
  | "completed_work"
  | "attendance"
  | "bonus"
  | "penalty"
  | "payment"
  | "publishing"
  | "profile_update"
  | "permission_change"
  | "other";

export type CrewTimelineItem = {
  id: string;
  kind: CrewTimelineKind;
  title: string;
  detail?: string;
  occurredAt: string;
  href?: string;
};

const EVENT_KIND: Partial<Record<BusinessEventType, CrewTimelineKind>> = {
  CrewAssigned: "assigned_order",
  CrewRemoved: "assigned_order",
  CrewPaid: "payment",
  CrewBonusGenerated: "bonus",
  DeliveryCompleted: "publishing",
  DeliveryCreated: "publishing",
  OrderCompleted: "completed_work",
  OrderConfirmed: "assigned_order",
};

function kindLabel(kind: CrewTimelineKind): string {
  switch (kind) {
    case "assigned_order":
      return "Assigned Order";
    case "completed_work":
      return "Completed Work";
    case "attendance":
      return "Attendance";
    case "bonus":
      return "Bonus";
    case "penalty":
      return "Penalty";
    case "payment":
      return "Payment";
    case "publishing":
      return "Publishing";
    case "profile_update":
      return "Profile Update";
    case "permission_change":
      return "Permission Change";
    default:
      return "Activity";
  }
}

function eventForPerson(e: BusinessEvent, personId: string): boolean {
  return e.payload.personId === personId;
}

/** Build timeline from business_events + assignment history — never invents rows. */
export function buildCrewTimeline(
  person: Person,
  limit = 40
): CrewTimelineItem[] {
  const items: CrewTimelineItem[] = [];

  const events = listBusinessEvents(200).filter((e) =>
    eventForPerson(e, person.id)
  );

  for (const e of events) {
    const kind = EVENT_KIND[e.type] ?? "other";
    items.push({
      id: e.id,
      kind,
      title: e.payload.summary ?? kindLabel(kind),
      detail: e.type,
      occurredAt: e.occurredAt,
      href: e.payload.orderId ? `/orders/${e.payload.orderId}` : undefined,
    });
  }

  const assignments = getAssignmentsByPerson(person.id);
  for (const a of assignments) {
    const order = getOrderById(a.orderId);
    items.push({
      id: `asg-${a.id}`,
      kind: "assigned_order",
      title: `Assigned · ${a.role}${order ? ` · ${order.clientName}` : ""}`,
      detail: order ? `${order.id} · ${order.status}` : a.orderId,
      occurredAt: a.createdAt,
      href: `/orders/${a.orderId}`,
    });

    if (
      a.assignmentStatus === "completed" ||
      (order && isOrderCompleted(order.status))
    ) {
      items.push({
        id: `asg-done-${a.id}`,
        kind: "completed_work",
        title: `Completed · ${a.role}${order ? ` · ${order.clientName}` : ""}`,
        detail: order?.id,
        occurredAt: a.paidAt ?? order?.deliveryDate ?? a.createdAt,
        href: `/orders/${a.orderId}`,
      });
    }

    if (a.paidAmount > 0 && a.paidAt) {
      items.push({
        id: `pay-${a.id}`,
        kind: "payment",
        title: `Payment · ${a.paidAmount.toLocaleString("en-EG")} EGP`,
        detail: a.orderId,
        occurredAt: a.paidAt,
        href: `/orders/${a.orderId}`,
      });
    }
  }

  if (person.createdAt) {
    items.push({
      id: `join-${person.id}`,
      kind: "profile_update",
      title: "Crew record created",
      detail: person.displayName || person.nameEn || undefined,
      occurredAt: person.createdAt,
    });
  }

  if (person.updatedAt && person.updatedAt !== person.createdAt) {
    items.push({
      id: `upd-${person.id}-${person.updatedAt}`,
      kind: "profile_update",
      title: "Profile Update",
      detail: "people row updated",
      occurredAt: person.updatedAt,
    });
  }

  // Dedupe by id, newest first
  const seen = new Set<string>();
  return items
    .filter((i) => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit);
}

export { kindLabel as crewTimelineKindLabel };
