/**
 * Calendar repository stub — derive events in a later sprint.
 */
import type { CalendarEvent } from "@/lib/calendar/types";

export function getCalendarEvents(): CalendarEvent[] {
  return [];
}

export function getCalendarEventsByProject(
  projectId: string
): CalendarEvent[] {
  void projectId;
  return [];
}

export function getCalendarEventsByOrder(orderId: string): CalendarEvent[] {
  void orderId;
  return [];
}
