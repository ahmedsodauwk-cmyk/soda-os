/**
 * SODA LIVE — legacy adapter over the activity feed.
 * Prefer buildActivityFeed() for the Command Center surface.
 */

import { buildActivityFeed } from "@/lib/dashboard/activity-feed";
import type { SodaLiveItem } from "@/lib/brand/types";
import type { DashboardSnapshot } from "@/lib/dashboard/types";

const LIVE_ROTATE_MS = 10_000;

export function getSodaLiveRotateMs(): number {
  return LIVE_ROTATE_MS;
}

/** Map activity feed → legacy SodaLiveItem shape for soft compatibility. */
export function buildSodaLiveItems(
  _snapshot?: DashboardSnapshot
): SodaLiveItem[] {
  void _snapshot;
  return buildActivityFeed().map((e) => ({
    id: e.id,
    kind:
      e.kind === "payment"
        ? "payment"
        : e.kind === "delivery"
          ? "delivery"
          : e.kind === "shoot"
            ? "shoot"
            : e.kind === "journey"
              ? "milestone"
              : "activity",
    eyebrow: e.category,
    title: e.description,
    body: e.description,
    at: e.at,
    href: e.href,
  }));
}
