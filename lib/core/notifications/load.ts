import { cache } from "react";

import { refreshAssignments } from "@/lib/assignments/repository";
import { getClients } from "@/lib/clients/repository";
import { refreshBusinessEventsFromDb } from "@/lib/core/events-store";
import {
  hydrateNotificationsFromEvents,
  mapEventsToNotifications,
} from "@/lib/core/notifications/engine";
import { applySmartSync } from "@/lib/core/notifications/lifecycle";
import {
  applyPersistedState,
  loadNotificationStatesForUser,
} from "@/lib/core/notifications/state-store";
import type { NotificationRecord } from "@/lib/core/types";
import {
  buildDataScope,
  scopeBusinessEvents,
} from "@/lib/identity/data-scope";
import type { SodaSession } from "@/lib/identity/session";
import { getOrders } from "@/lib/orders/repository";
import { refreshDashboardDomainData } from "@/lib/supabase/refresh-all";

async function withLifecycle(
  session: SodaSession,
  items: NotificationRecord[],
  events: Awaited<ReturnType<typeof refreshBusinessEventsFromDb>>
): Promise<NotificationRecord[]> {
  const stateMap = await loadNotificationStatesForUser(session.userId).catch(
    () => new Map()
  );
  const merged = applyPersistedState(items, stateMap);
  const synced = applySmartSync(merged, events);
  // Hide dismissed / archived from center (completed via dismiss stays out of feed)
  return synced.filter((n) => !n.dismissedAt && !n.archivedAt);
}

/**
 * Unscoped hydrate (Founder / internal). Prefer loadNotificationsForSession.
 * React cache per request — never treat this as user-scoped.
 */
export const loadHydratedNotifications = cache(
  async (): Promise<NotificationRecord[]> => {
    const events = await refreshBusinessEventsFromDb(80).catch(() => []);
    return hydrateNotificationsFromEvents(events);
  }
);

/**
 * Notifications for the authenticated user only (Mission 04.5 + 06.1).
 * NEVER returns the global company event stream to Team / TL / AM.
 * Merges durable lifecycle + smart sync; does not change scope rules.
 * React cache per request — shell layout + pages must not double-hydrate.
 */
export const loadNotificationsForSession = cache(
  async (
    session: SodaSession | null | undefined
  ): Promise<NotificationRecord[]> => {
    if (!session) return [];

    if (session.profile.accessLevel === "founder") {
      const [events] = await Promise.all([
        refreshBusinessEventsFromDb(80).catch(() => []),
        refreshAssignments().catch(() => undefined),
      ]);
      const items = hydrateNotificationsFromEvents(events);
      return withLifecycle(session, items, events);
    }

    // Wider pull then filter — scoped users often aren't in the latest 80 company events.
    const [events] = await Promise.all([
      refreshBusinessEventsFromDb(300).catch(() => [] as Awaited<
        ReturnType<typeof refreshBusinessEventsFromDb>
      >),
      refreshDashboardDomainData(),
    ]);

    const scope = buildDataScope(session, {
      orders: getOrders(),
      clients: getClients(),
    });

    const scopedEvents = scopeBusinessEvents(events, scope);
    // Pure map — do not mutate process-global notification store (cross-user safety).
    const items = mapEventsToNotifications(scopedEvents, 50);
    return withLifecycle(session, items, scopedEvents);
  }
);
