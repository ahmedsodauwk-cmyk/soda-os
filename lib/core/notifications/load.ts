import { cache } from "react";

import { refreshBusinessEventsFromDb } from "@/lib/core/events-store";
import { hydrateNotificationsFromEvents } from "@/lib/core/notifications/engine";
import type { NotificationRecord } from "@/lib/core/types";

/**
 * ONE hydrate path for bell + notifications page (React cache per request).
 * Always maps via Human Notification Layer — never raw event titles.
 */
export const loadHydratedNotifications = cache(
  async (): Promise<NotificationRecord[]> => {
    const events = await refreshBusinessEventsFromDb(80).catch(() => []);
    return hydrateNotificationsFromEvents(events);
  }
);
