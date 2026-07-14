/**
 * Timeline grouping — Today / Yesterday / This Week / Older.
 */

import type { NotificationRecord } from "@/lib/core/types";

export type NotificationTimeGroup =
  | "today"
  | "yesterday"
  | "this_week"
  | "older";

export const NOTIFICATION_TIME_GROUP_LABELS: Record<
  NotificationTimeGroup,
  string
> = {
  today: "النهاردة",
  yesterday: "امبارح",
  this_week: "الأسبوع ده",
  older: "أقدم",
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function timeGroupFor(
  iso: string,
  now = new Date()
): NotificationTimeGroup {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "older";
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

  const day = startOfDay(at);
  if (day.getTime() === today.getTime()) return "today";
  if (day.getTime() === yesterday.getTime()) return "yesterday";
  if (day.getTime() >= weekStart.getTime()) return "this_week";
  return "older";
}

export type NotificationGroupBucket = {
  key: NotificationTimeGroup;
  label: string;
  items: NotificationRecord[];
};

/** Preserve priority/time sort of input; bucket into timeline groups. */
export function groupNotificationsByTimeline(
  items: NotificationRecord[],
  now = new Date()
): NotificationGroupBucket[] {
  const order: NotificationTimeGroup[] = [
    "today",
    "yesterday",
    "this_week",
    "older",
  ];
  const buckets = new Map<NotificationTimeGroup, NotificationRecord[]>();
  for (const key of order) buckets.set(key, []);

  for (const item of items) {
    const key = timeGroupFor(item.createdAt, now);
    buckets.get(key)!.push(item);
  }

  return order
    .map((key) => ({
      key,
      label: NOTIFICATION_TIME_GROUP_LABELS[key],
      items: buckets.get(key) ?? [],
    }))
    .filter((b) => b.items.length > 0);
}
