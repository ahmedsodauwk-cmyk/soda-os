/**
 * Calendar foundation — types only (no full Calendar module this sprint).
 * Shoot/delivery events derive primarily from Order dates; Project may anchor milestones.
 */
export type CalendarEventKind =
  | "shoot"
  | "delivery"
  | "milestone"
  | "internal";

export type CalendarEventSource = "derived" | "manual";

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  kind: CalendarEventKind;
  projectId?: string;
  orderId?: string;
  workspaceId?: string;
  team?: string;
  location?: string;
  source: CalendarEventSource;
}
