"use client";

/**
 * Optimistic notification lifecycle across Header bell + Notification Center.
 * Server remains source of truth after revalidate; localStorage bridges soft nav.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  archiveNotificationAction,
  dismissNotificationAction,
  markAllNotificationsReadAction,
  markNotificationsReadAction,
} from "@/lib/core/notifications/actions";
import {
  mergeClientLifecycle,
  patchClientLifecycle,
  patchClientLifecycleMany,
} from "@/lib/core/notifications/client-state";
import type {
  NotificationLifecycleStatus,
  NotificationRecord,
} from "@/lib/core/types";

type NotificationLiveContextValue = {
  items: NotificationRecord[];
  unreadCount: number;
  pending: boolean;
  userId?: string;
  markRead: (ids: string | string[]) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  archive: (id: string) => void;
  setStatusLocal: (
    id: string,
    status: NotificationLifecycleStatus,
    extras?: Partial<NotificationRecord>
  ) => void;
};

const NotificationLiveContext =
  createContext<NotificationLiveContextValue | null>(null);

function fingerprint(items: NotificationRecord[]): string {
  return items
    .map(
      (n) =>
        `${n.id}:${n.status}:${n.read ? 1 : 0}:${n.dismissedAt ?? ""}:${n.archivedAt ?? ""}`
    )
    .join("|");
}

export function NotificationLiveProvider({
  userId,
  initial,
  children,
}: {
  userId?: string;
  initial: NotificationRecord[];
  children: ReactNode;
}) {
  const [items, setItems] = useState<NotificationRecord[]>(() =>
    userId ? mergeClientLifecycle(userId, initial) : initial
  );
  const [pending, startTransition] = useTransition();
  const lastServerFp = useRef(fingerprint(initial));

  useEffect(() => {
    const fp = fingerprint(initial);
    if (fp === lastServerFp.current) return;
    lastServerFp.current = fp;
    const next = userId ? mergeClientLifecycle(userId, initial) : initial;
    setItems(next);
  }, [initial, userId]);

  const markRead = useCallback(
    (ids: string | string[]) => {
      const list = Array.isArray(ids) ? ids : [ids];
      if (list.length === 0) return;
      const set = new Set(list);
      setItems((prev) =>
        prev.map((n) =>
          set.has(n.id) && n.status === "unread"
            ? { ...n, status: "read", read: true }
            : n
        )
      );
      if (userId) {
        patchClientLifecycleMany(userId, list, {
          status: "read",
          read: true,
        });
      }
      startTransition(async () => {
        await markNotificationsReadAction(list);
      });
    },
    [userId]
  );

  const markAllRead = useCallback(() => {
    setItems((prev) => {
      const unreadIds = prev
        .filter((n) => n.status === "unread")
        .map((n) => n.id);
      if (userId && unreadIds.length) {
        patchClientLifecycleMany(userId, unreadIds, {
          status: "read",
          read: true,
        });
      }
      return prev.map((n) =>
        n.status === "unread" ? { ...n, status: "read" as const, read: true } : n
      );
    });
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  }, [userId]);

  const dismiss = useCallback(
    (id: string) => {
      const at = new Date().toISOString();
      setItems((prev) => prev.filter((n) => n.id !== id));
      if (userId) {
        patchClientLifecycle(userId, id, {
          status: "completed",
          read: true,
          dismissedAt: at,
          completedAt: at,
        });
      }
      startTransition(async () => {
        await dismissNotificationAction(id);
      });
    },
    [userId]
  );

  const archive = useCallback(
    (id: string) => {
      const at = new Date().toISOString();
      setItems((prev) => prev.filter((n) => n.id !== id));
      if (userId) {
        patchClientLifecycle(userId, id, {
          status: "completed",
          read: true,
          archivedAt: at,
          completedAt: at,
        });
      }
      startTransition(async () => {
        await archiveNotificationAction(id);
      });
    },
    [userId]
  );

  const setStatusLocal = useCallback(
    (
      id: string,
      status: NotificationLifecycleStatus,
      extras?: Partial<NotificationRecord>
    ) => {
      setItems((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                ...extras,
                status,
                read: status !== "unread",
              }
            : n
        )
      );
      if (userId) {
        patchClientLifecycle(userId, id, {
          status,
          read: status !== "unread",
          acknowledgedAt: extras?.acknowledgedAt,
          completedAt: extras?.completedAt,
          dismissedAt: extras?.dismissedAt,
          archivedAt: extras?.archivedAt,
        });
      }
    },
    [userId]
  );

  const unreadCount = useMemo(
    () => items.filter((n) => n.status === "unread").length,
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      pending,
      userId,
      markRead,
      markAllRead,
      dismiss,
      archive,
      setStatusLocal,
    }),
    [
      items,
      unreadCount,
      pending,
      userId,
      markRead,
      markAllRead,
      dismiss,
      archive,
      setStatusLocal,
    ]
  );

  return (
    <NotificationLiveContext.Provider value={value}>
      {children}
    </NotificationLiveContext.Provider>
  );
}

export function useNotificationLive(): NotificationLiveContextValue {
  const ctx = useContext(NotificationLiveContext);
  if (!ctx) {
    throw new Error(
      "useNotificationLive must be used within NotificationLiveProvider"
    );
  }
  return ctx;
}

export function useNotificationLiveOptional(): NotificationLiveContextValue | null {
  return useContext(NotificationLiveContext);
}
