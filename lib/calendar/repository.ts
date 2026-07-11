/**
 * Calendar — derived from project.calendar jsonb + order shoot/delivery dates.
 * Holding / Cancelled orders are excluded (Smart Order Engine V3).
 */
import type { CalendarEvent } from "@/lib/calendar/types";
import { getOrders, refreshOrders } from "@/lib/orders/repository";
import { isOrderCalendarVisible } from "@/lib/orders/status";
import { getProjects, refreshProjects } from "@/lib/projects/repository";

function fromProjects(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const project of getProjects()) {
    for (const ev of project.calendar) {
      events.push({
        id: ev.id,
        title: ev.title,
        startsAt: ev.startsAt,
        kind: ev.kind,
        projectId: project.id,
        source: "derived",
        ...(ev.location ? { location: ev.location } : {}),
      });
    }
  }
  return events;
}

function fromOrders(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const order of getOrders()) {
    if (!isOrderCalendarVisible(order.status)) continue;
    if (order.shootDate) {
      events.push({
        id: `ord-shoot-${order.id}`,
        title: `Shoot · ${order.clientName}`,
        startsAt: `${order.shootDate}T09:00:00Z`,
        kind: "shoot",
        projectId: order.projectId,
        orderId: order.id,
        location: order.location,
        source: "derived",
      });
    }
    if (order.deliveryDate) {
      events.push({
        id: `ord-delivery-${order.id}`,
        title: `Delivery · ${order.clientName}`,
        startsAt: `${order.deliveryDate}T17:00:00Z`,
        kind: "delivery",
        projectId: order.projectId,
        orderId: order.id,
        source: "derived",
      });
    }
  }
  return events;
}

/** Refresh projects + orders so calendar reads live Supabase data. */
export async function refreshCalendar(): Promise<CalendarEvent[]> {
  await Promise.all([refreshProjects(), refreshOrders()]);
  return getCalendarEvents();
}

export function getCalendarEvents(): CalendarEvent[] {
  const map = new Map<string, CalendarEvent>();
  for (const ev of [...fromProjects(), ...fromOrders()]) {
    map.set(ev.id, ev);
  }
  return [...map.values()].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt)
  );
}

export function getCalendarEventsByProject(
  projectId: string
): CalendarEvent[] {
  return getCalendarEvents().filter((e) => e.projectId === projectId);
}

export function getCalendarEventsByOrder(orderId: string): CalendarEvent[] {
  return getCalendarEvents().filter((e) => e.orderId === orderId);
}

/** Events on or after a local YYYY-MM-DD (inclusive). */
export function getUpcomingCalendarEvents(
  fromDate: string,
  limit = 50
): CalendarEvent[] {
  return getCalendarEvents()
    .filter((e) => e.startsAt.slice(0, 10) >= fromDate)
    .slice(0, limit);
}
