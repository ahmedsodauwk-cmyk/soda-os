/**
 * Client-side lifecycle cache (Mission 06.1 hybrid).
 * Complements durable `public.notifications` rows when DB write is slow/offline.
 * Keyed by userId so scoped users never bleed state across accounts on one device.
 */

import type {
  NotificationLifecycleStatus,
  NotificationRecord,
} from "@/lib/core/types";

const STORAGE_PREFIX = "soda.ntf.lifecycle.v1:";

export type ClientLifecyclePatch = {
  status: NotificationLifecycleStatus;
  read: boolean;
  acknowledgedAt?: string;
  completedAt?: string;
  archivedAt?: string;
  dismissedAt?: string;
  updatedAt: string;
};

type StoreShape = Record<string, ClientLifecyclePatch>;

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function readStore(userId: string): StoreShape {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoreShape;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(userId: string, store: StoreShape): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(store));
  } catch {
    // Quota / private mode — ignore; optimistic UI still works in memory.
  }
}

export function getClientLifecycleMap(userId: string): StoreShape {
  return readStore(userId);
}

export function patchClientLifecycle(
  userId: string,
  notificationId: string,
  patch: Omit<ClientLifecyclePatch, "updatedAt"> & { updatedAt?: string }
): void {
  const store = readStore(userId);
  store[notificationId] = {
    ...store[notificationId],
    ...patch,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };
  writeStore(userId, store);
}

export function patchClientLifecycleMany(
  userId: string,
  ids: string[],
  patch: Omit<ClientLifecyclePatch, "updatedAt"> & { updatedAt?: string }
): void {
  const store = readStore(userId);
  const updatedAt = patch.updatedAt ?? new Date().toISOString();
  for (const id of ids) {
    store[id] = { ...store[id], ...patch, updatedAt };
  }
  writeStore(userId, store);
}

/** Apply localStorage patches onto server-hydrated list (client only). */
export function mergeClientLifecycle(
  userId: string,
  items: NotificationRecord[]
): NotificationRecord[] {
  const store = readStore(userId);
  if (Object.keys(store).length === 0) return items;
  return items.map((n) => {
    const p = store[n.id];
    if (!p) return n;
    return {
      ...n,
      status: p.status,
      read: p.read,
      acknowledgedAt: p.acknowledgedAt ?? n.acknowledgedAt,
      completedAt: p.completedAt ?? n.completedAt,
      archivedAt: p.archivedAt ?? n.archivedAt,
      dismissedAt: p.dismissedAt ?? n.dismissedAt,
    };
  });
}
