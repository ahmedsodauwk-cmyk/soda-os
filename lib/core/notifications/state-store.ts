/**
 * Durable per-user notification lifecycle (public.notifications).
 * Content still comes from business_events; this store is status/history only.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  NotificationCategory,
  NotificationHistoryEntry,
  NotificationLifecycleStatus,
  NotificationPriority,
  NotificationRecord,
} from "@/lib/core/types";

export type PersistedNotificationState = {
  id: string;
  eventId: string;
  status: NotificationLifecycleStatus;
  read: boolean;
  category?: NotificationCategory | null;
  priority?: NotificationPriority | null;
  requiresAck: boolean;
  acknowledgedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  dismissedAt?: string | null;
  history: NotificationHistoryEntry[];
  updatedAt?: string | null;
};

function rowId(userId: string, eventId: string): string {
  return `${userId}:${eventId}`;
}

function parseStatus(raw: unknown): NotificationLifecycleStatus {
  if (
    raw === "unread" ||
    raw === "read" ||
    raw === "acknowledged" ||
    raw === "completed"
  ) {
    return raw;
  }
  return "unread";
}

function parseHistory(raw: unknown): NotificationHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (h): h is NotificationHistoryEntry =>
        !!h &&
        typeof h === "object" &&
        typeof (h as NotificationHistoryEntry).at === "string" &&
        typeof (h as NotificationHistoryEntry).status === "string"
    )
    .slice(-20);
}

/** Load lifecycle map for the signed-in user (keyed by eventId and notification id). */
export async function loadNotificationStatesForUser(
  userId: string
): Promise<Map<string, PersistedNotificationState>> {
  const map = new Map<string, PersistedNotificationState>();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, event_id, status, read, category, priority, requires_ack, acknowledged_at, completed_at, archived_at, dismissed_at, history, updated_at"
      )
      .eq("user_id", userId)
      .limit(500);

    if (error || !data) return map;

    for (const row of data as Record<string, unknown>[]) {
      const eventId = String(row.event_id ?? "");
      if (!eventId) continue;
      const status = row.read === false && !row.status
        ? "unread"
        : parseStatus(row.status ?? (row.read ? "read" : "unread"));
      const state: PersistedNotificationState = {
        id: String(row.id),
        eventId,
        status,
        read: status !== "unread",
        category: (row.category as NotificationCategory | null) ?? null,
        priority: (row.priority as NotificationPriority | null) ?? null,
        requiresAck: Boolean(row.requires_ack),
        acknowledgedAt: (row.acknowledged_at as string | null) ?? null,
        completedAt: (row.completed_at as string | null) ?? null,
        archivedAt: (row.archived_at as string | null) ?? null,
        dismissedAt: (row.dismissed_at as string | null) ?? null,
        history: parseHistory(row.history),
        updatedAt: (row.updated_at as string | null) ?? null,
      };
      map.set(eventId, state);
      map.set(`ntf-${eventId}`, state);
    }
  } catch {
    // Table/columns may not exist until migration applied — degrade gracefully.
  }
  return map;
}

export function applyPersistedState(
  items: NotificationRecord[],
  stateByKey: Map<string, PersistedNotificationState>
): NotificationRecord[] {
  return items.map((n) => {
    const state = stateByKey.get(n.eventId) ?? stateByKey.get(n.id);
    if (!state) return n;
    if (state.dismissedAt || state.archivedAt) {
      return {
        ...n,
        status: "completed",
        read: true,
        dismissedAt: state.dismissedAt ?? undefined,
        archivedAt: state.archivedAt ?? undefined,
        acknowledgedAt: state.acknowledgedAt ?? n.acknowledgedAt,
        completedAt: state.completedAt ?? n.completedAt,
        history: state.history.length ? state.history : n.history,
      };
    }
    return {
      ...n,
      status: state.status,
      read: state.status !== "unread",
      acknowledgedAt: state.acknowledgedAt ?? n.acknowledgedAt,
      completedAt: state.completedAt ?? n.completedAt,
      history: state.history.length ? state.history : n.history,
    };
  });
}

export type UpsertLifecycleInput = {
  userId: string;
  notification: Pick<
    NotificationRecord,
    | "id"
    | "eventId"
    | "eventType"
    | "title"
    | "body"
    | "href"
    | "entityType"
    | "entityId"
    | "priority"
    | "category"
    | "requiresAck"
    | "createdAt"
  >;
  status: NotificationLifecycleStatus;
  acknowledgedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  dismissedAt?: string | null;
  historyEntry?: NotificationHistoryEntry;
};

/** Upsert one lifecycle row (RLS: own user only). */
export async function upsertNotificationLifecycle(
  input: UpsertLifecycleInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const id = rowId(input.userId, input.notification.eventId);
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("notifications")
      .select("history, status")
      .eq("id", id)
      .maybeSingle();

    const prevHistory = parseHistory(
      (existing as { history?: unknown } | null)?.history
    );
    const history = input.historyEntry
      ? [...prevHistory, input.historyEntry].slice(-20)
      : prevHistory;

    const row = {
      id,
      user_id: input.userId,
      event_id: input.notification.eventId,
      event_type: input.notification.eventType,
      title: input.notification.title,
      body: input.notification.body,
      href: input.notification.href ?? null,
      entity_type: input.notification.entityType,
      entity_id: input.notification.entityId,
      read: input.status !== "unread",
      status: input.status,
      category: input.notification.category,
      priority: input.notification.priority,
      requires_ack: Boolean(input.notification.requiresAck),
      acknowledged_at: input.acknowledgedAt ?? null,
      completed_at: input.completedAt ?? null,
      archived_at: input.archivedAt ?? null,
      dismissed_at: input.dismissedAt ?? null,
      history,
      created_at: input.notification.createdAt || now,
      updated_at: now,
    };

    const { error } = await supabase.from("notifications").upsert(row, {
      onConflict: "id",
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل حفظ حالة التنبيه",
    };
  }
}

export async function upsertManyNotificationLifecycle(
  inputs: UpsertLifecycleInput[]
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  let count = 0;
  for (const input of inputs) {
    const res = await upsertNotificationLifecycle(input);
    if (!res.ok) return res;
    count += 1;
  }
  return { ok: true, count };
}
