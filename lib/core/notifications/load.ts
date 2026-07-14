import { cache } from "react";

import { getClients } from "@/lib/clients/repository";
import { refreshBusinessEventsFromDb } from "@/lib/core/events-store";
import {
  hydrateNotificationsFromEvents,
  mapEventsToNotifications,
} from "@/lib/core/notifications/engine";
import type { NotificationRecord } from "@/lib/core/types";
import {
  buildDataScope,
  scopeBusinessEvents,
} from "@/lib/identity/data-scope";
import type { SodaSession } from "@/lib/identity/session";
import { getOrders } from "@/lib/orders/repository";
import { refreshDashboardDomainData } from "@/lib/supabase/refresh-all";

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
 * Notifications for the authenticated user only (Mission 04.5).
 * NEVER returns the global company event stream to Team / TL / AM.
 */
export async function loadNotificationsForSession(
  session: SodaSession | null | undefined
): Promise<NotificationRecord[]> {
  if (!session) return [];

  if (session.profile.accessLevel === "founder") {
    return loadHydratedNotifications();
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
  return mapEventsToNotifications(scopedEvents, 50);
}
