"use server";

/**
 * Human Notification decisions + lifecycle writes (Mission 06.1).
 * Confirm / Decline crew assignments via existing assignmentStatus APIs.
 * Read / Ack / Archive / Dismiss persist to public.notifications (hybrid with localStorage).
 * Does NOT change Mission 04.5 scope — only updates rows owned by the session user.
 */

import { revalidatePath } from "next/cache";

import { updateAssignment } from "@/lib/assignments/repository";
import { refreshAssignments } from "@/lib/assignments/repository";
import { appendHistory } from "@/lib/core/notifications/lifecycle";
import { upsertNotificationLifecycle } from "@/lib/core/notifications/state-store";
import { loadNotificationsForSession } from "@/lib/core/notifications/load";
import type {
  NotificationLifecycleStatus,
  NotificationRecord,
} from "@/lib/core/types";
import { resolveSessionForApp } from "@/lib/identity/session";

export type CrewDecisionResult =
  | { ok: true; status: "confirmed" | "cancelled" }
  | { ok: false; error: string };

export type LifecycleResult =
  | { ok: true; ids: string[]; status: NotificationLifecycleStatus }
  | { ok: false; error: string };

function revalidateNotificationSurfaces(orderId?: string | null) {
  revalidatePath("/notifications");
  revalidatePath("/");
  if (orderId) revalidatePath(`/orders/${orderId}`);
}

async function requireSessionNotifications(): Promise<
  | { ok: true; userId: string; items: NotificationRecord[] }
  | { ok: false; error: string }
> {
  const session = await resolveSessionForApp();
  if (!session) return { ok: false, error: "سجّل دخولك تاني" };
  const items = await loadNotificationsForSession(session);
  return { ok: true, userId: session.userId, items };
}

async function persistStatus(
  userId: string,
  items: NotificationRecord[],
  ids: string[],
  status: NotificationLifecycleStatus,
  extras?: {
    acknowledgedAt?: string;
    completedAt?: string;
    archivedAt?: string;
    dismissedAt?: string;
    note?: string;
  }
): Promise<LifecycleResult> {
  const at = new Date().toISOString();
  const targets = items.filter((n) => ids.includes(n.id));
  if (targets.length === 0) {
    return { ok: false, error: "التنبيه مش موجود في نطاقك" };
  }

  for (const n of targets) {
    const historyEntry = {
      at,
      status:
        extras?.dismissedAt || extras?.archivedAt
          ? extras.dismissedAt
            ? ("dismissed" as const)
            : ("archived" as const)
          : status,
      note: extras?.note,
    };
    const res = await upsertNotificationLifecycle({
      userId,
      notification: n,
      status,
      acknowledgedAt:
        extras?.acknowledgedAt ??
        (status === "acknowledged" || status === "completed"
          ? (n.acknowledgedAt ?? at)
          : n.acknowledgedAt),
      completedAt:
        extras?.completedAt ??
        (status === "completed" ? (n.completedAt ?? at) : n.completedAt),
      archivedAt: extras?.archivedAt ?? n.archivedAt,
      dismissedAt: extras?.dismissedAt ?? n.dismissedAt,
      historyEntry,
    });
    if (!res.ok) return { ok: false, error: res.error };
    // Keep in-memory history consistent for callers that re-read same request cache
    n.history = appendHistory(n.history, {
      at: historyEntry.at,
      status:
        historyEntry.status === "dismissed" ||
        historyEntry.status === "archived"
          ? status
          : historyEntry.status,
      note: historyEntry.note,
    });
    n.status = status;
    n.read = status !== "unread";
  }

  revalidateNotificationSurfaces();
  return { ok: true, ids: targets.map((t) => t.id), status };
}

export async function confirmCrewAssignment(
  assignmentId: string
): Promise<CrewDecisionResult> {
  const id = assignmentId?.trim();
  if (!id) return { ok: false, error: "تعيين غير موجود" };
  try {
    await refreshAssignments().catch(() => undefined);
    const updated = await updateAssignment(id, {
      assignmentStatus: "confirmed",
    });
    if (!updated) return { ok: false, error: "التعيين مش موجود" };

    // Advance related notification to acknowledged when detectable
    const loaded = await requireSessionNotifications();
    if (loaded.ok) {
      const related = loaded.items.filter((n) =>
        n.actions?.some((a) => a.assignmentId === id)
      );
      if (related.length) {
        await persistStatus(
          loaded.userId,
          loaded.items,
          related.map((r) => r.id),
          "acknowledged",
          { note: "اتأكد التعيين" }
        );
      }
    }

    revalidateNotificationSurfaces(updated.orderId);
    return { ok: true, status: "confirmed" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل التأكيد",
    };
  }
}

export async function declineCrewAssignment(
  assignmentId: string
): Promise<CrewDecisionResult> {
  const id = assignmentId?.trim();
  if (!id) return { ok: false, error: "تعيين غير موجود" };
  try {
    await refreshAssignments().catch(() => undefined);
    const updated = await updateAssignment(id, {
      assignmentStatus: "cancelled",
    });
    if (!updated) return { ok: false, error: "التعيين مش موجود" };

    const loaded = await requireSessionNotifications();
    if (loaded.ok) {
      const related = loaded.items.filter((n) =>
        n.actions?.some((a) => a.assignmentId === id)
      );
      if (related.length) {
        await persistStatus(
          loaded.userId,
          loaded.items,
          related.map((r) => r.id),
          "completed",
          { note: "اترفض التعيين", completedAt: new Date().toISOString() }
        );
      }
    }

    revalidateNotificationSurfaces(updated.orderId);
    return { ok: true, status: "cancelled" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل الرفض",
    };
  }
}

export async function markNotificationsReadAction(
  ids: string[]
): Promise<LifecycleResult> {
  const loaded = await requireSessionNotifications();
  if (!loaded.ok) return loaded;
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return { ok: false, error: "مفيش تنبيهات" };
  return persistStatus(loaded.userId, loaded.items, unique, "read", {
    note: "اتقراء",
  });
}

export async function markAllNotificationsReadAction(): Promise<LifecycleResult> {
  const loaded = await requireSessionNotifications();
  if (!loaded.ok) return loaded;
  const unread = loaded.items.filter((n) => n.status === "unread");
  if (unread.length === 0) {
    return { ok: true, ids: [], status: "read" };
  }
  return persistStatus(
    loaded.userId,
    loaded.items,
    unread.map((n) => n.id),
    "read",
    { note: "اتقراء الكل" }
  );
}

export async function acknowledgeNotificationAction(
  id: string
): Promise<LifecycleResult> {
  const loaded = await requireSessionNotifications();
  if (!loaded.ok) return loaded;
  return persistStatus(loaded.userId, loaded.items, [id], "acknowledged", {
    note: "اتأكد",
    acknowledgedAt: new Date().toISOString(),
  });
}

export async function completeNotificationAction(
  id: string
): Promise<LifecycleResult> {
  const loaded = await requireSessionNotifications();
  if (!loaded.ok) return loaded;
  return persistStatus(loaded.userId, loaded.items, [id], "completed", {
    note: "خلصت",
    completedAt: new Date().toISOString(),
  });
}

export async function dismissNotificationAction(
  id: string
): Promise<LifecycleResult> {
  const loaded = await requireSessionNotifications();
  if (!loaded.ok) return loaded;
  const at = new Date().toISOString();
  return persistStatus(loaded.userId, loaded.items, [id], "completed", {
    note: "اتجاهل",
    dismissedAt: at,
    completedAt: at,
  });
}

export async function archiveNotificationAction(
  id: string
): Promise<LifecycleResult> {
  const loaded = await requireSessionNotifications();
  if (!loaded.ok) return loaded;
  const at = new Date().toISOString();
  return persistStatus(loaded.userId, loaded.items, [id], "completed", {
    note: "اتأرشف",
    archivedAt: at,
    completedAt: at,
  });
}

/** Alias for Accept workflow copy in UI. */
export async function acceptCrewAssignment(
  assignmentId: string
): Promise<CrewDecisionResult> {
  return confirmCrewAssignment(assignmentId);
}

export async function rejectCrewAssignment(
  assignmentId: string
): Promise<CrewDecisionResult> {
  return declineCrewAssignment(assignmentId);
}
