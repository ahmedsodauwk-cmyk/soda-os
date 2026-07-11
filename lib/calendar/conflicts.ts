/**
 * Calendar conflict detection — crew double-booked on the same shoot day.
 * Uses assignments + order shoot dates (Business Core caches).
 */
import { getAssignments } from "@/lib/assignments/repository";
import type { CalendarEvent } from "@/lib/calendar/types";
import { getOrders } from "@/lib/orders/repository";
import { isOrderCalendarVisible } from "@/lib/orders/status";
import { getPersonById } from "@/lib/people/repository";

export interface CrewScheduleConflict {
  personId: string;
  personName: string;
  date: string;
  orderIds: string[];
  titles: string[];
}

export interface CalendarConflictReport {
  crew: CrewScheduleConflict[];
}

/** Same person assigned to 2+ calendar-visible orders on the same shoot date. */
export function detectCrewScheduleConflicts(): CrewScheduleConflict[] {
  const orders = getOrders().filter(
    (o) => isOrderCalendarVisible(o.status) && Boolean(o.shootDate)
  );
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const byPersonDay = new Map<string, Set<string>>();

  for (const a of getAssignments()) {
    if (a.assignmentStatus === "cancelled") continue;
    const order = orderById.get(a.orderId);
    if (!order?.shootDate) continue;
    const key = `${a.personId}::${order.shootDate}`;
    const set = byPersonDay.get(key) ?? new Set();
    set.add(order.id);
    byPersonDay.set(key, set);
  }

  const conflicts: CrewScheduleConflict[] = [];
  for (const [key, orderIds] of byPersonDay) {
    if (orderIds.size < 2) continue;
    const [personId, date] = key.split("::");
    const person = getPersonById(personId);
    const ids = [...orderIds];
    conflicts.push({
      personId,
      personName: person?.nickname || person?.nameEn || person?.nameAr || personId,
      date,
      orderIds: ids,
      titles: ids.map((id) => {
        const o = orderById.get(id);
        return o ? `Shoot · ${o.clientName}` : id;
      }),
    });
  }

  return conflicts.sort((a, b) => a.date.localeCompare(b.date));
}

export function getCalendarConflictReport(): CalendarConflictReport {
  return { crew: detectCrewScheduleConflicts() };
}

/** Events that participate in a crew conflict (for UI badges). */
export function conflictingOrderIds(): Set<string> {
  const set = new Set<string>();
  for (const c of detectCrewScheduleConflicts()) {
    for (const id of c.orderIds) set.add(id);
  }
  return set;
}

export function eventHasConflict(
  event: CalendarEvent,
  conflictOrderIds: Set<string> = conflictingOrderIds()
): boolean {
  return Boolean(event.orderId && conflictOrderIds.has(event.orderId));
}
