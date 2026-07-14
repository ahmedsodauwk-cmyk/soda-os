/**
 * Pure lifecycle presentation helpers — safe for Client Components.
 * Server sync stays in lifecycle.ts (Mission 06.1).
 */

import type {
  NotificationLifecycleStatus,
  NotificationRecord,
} from "@/lib/core/types";

export function isUnread(
  n: Pick<NotificationRecord, "status" | "read">
): boolean {
  if (n.status) return n.status === "unread";
  return !n.read;
}

export function lifecycleLabel(status: NotificationLifecycleStatus): string {
  switch (status) {
    case "unread":
      return "جديد";
    case "read":
      return "اتقراء";
    case "acknowledged":
      return "اتأكد";
    case "completed":
      return "خلص";
  }
}
