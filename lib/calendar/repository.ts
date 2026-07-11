/**
 * Calendar — derived from project.calendar jsonb + order shoot/delivery dates.
 * No dedicated calendar table in schema.
 */
import type { CalendarEvent } from "@/lib/calendar/types";
import { getOrders } from "@/lib/orders/repository";
import { getProjects } from "@/lib/projects/repository";

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
