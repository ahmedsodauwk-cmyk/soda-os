/**
 * SODA LIVE — awareness-only rotating content for Command Center.
 * Built only from real dashboard snapshot events. No fake quotes/milestones.
 */

import { getTeamDisplayName } from "@/lib/brand/team-names";
import { toEasternDigits } from "@/lib/brand/soda-voice";
import type { SodaLiveItem } from "@/lib/brand/types";
import type { DashboardSnapshot } from "@/lib/dashboard/types";

const LIVE_ROTATE_MS = 17_000;

export function getSodaLiveRotateMs(): number {
  return LIVE_ROTATE_MS;
}

/** Build awareness items from real schedule / orders / finance only. */
export function buildSodaLiveItems(
  snapshot: DashboardSnapshot
): SodaLiveItem[] {
  const items: SodaLiveItem[] = [];
  const n = toEasternDigits;

  for (const d of snapshot.schedule.deliveries.slice(0, 3)) {
    items.push({
      id: `live-delivery-${d.id}`,
      kind: "delivery",
      eyebrow: "Delivery",
      title: d.title,
      body: `${d.clientName} · تسليمة ${d.when === "today" ? "النهاردة" : "قريبة"}.`,
      at: d.date,
      href: "/orders",
    });
  }

  const nextShoot =
    snapshot.schedule.todayShoots[0] ?? snapshot.schedule.tomorrowShoots[0];
  if (nextShoot) {
    items.push({
      id: `live-shoot-${nextShoot.id}`,
      kind: "shoot",
      eyebrow: "Upcoming shoot",
      title: nextShoot.title,
      body: `${nextShoot.clientName} · ${nextShoot.location || "Location TBD"}`,
      at: nextShoot.date,
      href: "/orders",
    });
  }

  const overdue = snapshot.attention.filter(
    (a) => a.category === "overdue_delivery"
  );
  for (const item of overdue.slice(0, 2)) {
    items.push({
      id: `live-overdue-${item.id}`,
      kind: "activity",
      eyebrow: "Overdue",
      title: item.title,
      body: item.detail,
      at: snapshot.asOf,
      href: item.href ?? "/orders",
    });
  }

  const unpaid = snapshot.attention.filter(
    (a) => a.category === "unpaid_client"
  );
  for (const item of unpaid.slice(0, 2)) {
    items.push({
      id: `live-unpaid-${item.id}`,
      kind: "payment",
      eyebrow: "Unpaid",
      title: item.title,
      body: item.detail,
      at: snapshot.asOf,
      href: item.href ?? "/clients",
    });
  }

  // Workload from real assignment counts only when elevated
  const topMember = snapshot.team.find((m) => m.currentWorkload >= 3);
  if (topMember) {
    const arName = getTeamDisplayName(topMember.name, topMember.id);
    items.push({
      id: `live-load-${topMember.id}`,
      kind: "achievement",
      eyebrow: "Workload",
      title: arName,
      body: `${topMember.role} · ${n(topMember.currentWorkload)} assignments نشطة · ${n(topMember.ordersCompleted)} orders مكتملة.`,
      at: snapshot.asOf,
      href: `/crew/${topMember.id}`,
    });
  }

  for (const order of snapshot.recentOrders.slice(0, 2)) {
    items.push({
      id: `live-activity-${order.id}`,
      kind: "activity",
      eyebrow: "Recent order",
      title: order.clientName,
      body: `${order.projectType} · ${order.status}`,
      at: order.shootDate,
      href: "/orders",
    });
  }

  return items.sort((a, b) => {
    if (a.at && b.at) return b.at.localeCompare(a.at);
    if (a.at && !b.at) return -1;
    if (!a.at && b.at) return 1;
    return 0;
  });
}
