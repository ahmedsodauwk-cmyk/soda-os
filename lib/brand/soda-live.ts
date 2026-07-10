/**
 * SODA LIVE — awareness-only rotating content for Command Center.
 * Built from existing dashboard snapshot + brand quotes. No new business math.
 */

import { SODA_QUOTES } from "@/lib/brand/quotes";
import { getTeamDisplayName } from "@/lib/brand/team-names";
import { toEasternDigits } from "@/lib/brand/soda-voice";
import type { SodaLiveItem } from "@/lib/brand/types";
import type { DashboardSnapshot } from "@/lib/dashboard/types";

const LIVE_ROTATE_MS = 17_000;

export function getSodaLiveRotateMs(): number {
  return LIVE_ROTATE_MS;
}

/** Build awareness items — newest first when dated; quotes fill the rest. */
export function buildSodaLiveItems(
  snapshot: DashboardSnapshot
): SodaLiveItem[] {
  const items: SodaLiveItem[] = [];
  const n = toEasternDigits;

  // Recent deliveries / schedule awareness
  for (const d of snapshot.schedule.deliveries.slice(0, 3)) {
    items.push({
      id: `live-delivery-${d.id}`,
      kind: "delivery",
      eyebrow: "Recent delivery",
      title: d.title,
      body: `${d.clientName} · تسليمة ${d.when === "today" ? "النهاردة" : "قريبة"} على الرادار.`,
      at: d.date,
      href: "/orders",
    });
  }

  // Upcoming shoot spotlight
  const nextShoot =
    snapshot.schedule.todayShoots[0] ?? snapshot.schedule.tomorrowShoots[0];
  if (nextShoot) {
    items.push({
      id: `live-shoot-${nextShoot.id}`,
      kind: "shoot",
      eyebrow: "Upcoming shoot",
      title: nextShoot.title,
      body: `${nextShoot.clientName} · ${nextShoot.location || "Location TBD"} — جهّز الـ brief.`,
      at: nextShoot.date,
      href: "/orders",
    });
  }

  // Workspace spotlight — highest revenue lane
  const topWs = [...snapshot.workspaces].sort(
    (a, b) => b.revenue - a.revenue
  )[0];
  if (topWs) {
    items.push({
      id: `live-ws-${topWs.id}`,
      kind: "workspace",
      eyebrow: "Workspace spotlight",
      title: topWs.label,
      body: `${n(topWs.activeProjects)} project نشط · ${n(topWs.progress)}٪ progress — الـ lane دي شغّالة.`,
      at: snapshot.asOf,
      href: `/workspaces/${topWs.slug}`,
    });
  }

  // Employee achievement — top activity score
  const topMember = snapshot.team[0];
  if (topMember) {
    const arName = getTeamDisplayName(topMember.name, topMember.id);
    items.push({
      id: `live-ach-${topMember.id}`,
      kind: "achievement",
      eyebrow: "Employee achievement",
      title: arName,
      body: `${topMember.role} · ${n(topMember.ordersCompleted)} order خلص · load ${n(topMember.currentWorkload)}. شادّ النهاردة.`,
      at: snapshot.asOf,
    });
  }

  // Company milestone from MoM revenue
  const mom = snapshot.kpis.revenueMonthChangePct;
  if (mom != null && mom >= 10) {
    items.push({
      id: "live-milestone-mom",
      kind: "milestone",
      eyebrow: "Company milestone",
      title: `+${n(mom)}٪ vs last month`,
      body: "الشهر ماشي بإيقاع قوي — خلّي الجودة زي الزحمة.",
      at: snapshot.asOf,
    });
  } else if (snapshot.kpis.activeOrders >= 5) {
    items.push({
      id: "live-milestone-pipeline",
      kind: "milestone",
      eyebrow: "Company milestone",
      title: `${n(snapshot.kpis.activeOrders)} active orders`,
      body: "الـ pipeline صاحي — الستوديو في حالة شغل حلوة.",
      at: snapshot.asOf,
    });
  }

  // Recent activity from recent orders
  for (const order of snapshot.recentOrders.slice(0, 2)) {
    items.push({
      id: `live-activity-${order.id}`,
      kind: "activity",
      eyebrow: "Recent activity",
      title: order.clientName,
      body: `${order.projectType} · ${order.status} — حركة جديدة على الـ pipeline.`,
      at: order.shootDate,
      href: "/orders",
    });
  }

  // Soft payment awareness (not critical ops — celebration / note)
  if (snapshot.financial.collected > 0) {
    items.push({
      id: "live-payment-collected",
      kind: "payment",
      eyebrow: "Payments pulse",
      title: "Cash in the studio",
      body: "في تحصيل مسجّل الشهر ده — الفلوس بتتحرك مع الشغل.",
      at: snapshot.asOf,
    });
  }

  // Creative quotes — evergreen
  for (const q of SODA_QUOTES) {
    items.push({
      id: q.id,
      kind: "quote",
      eyebrow: "Creative note",
      title: q.title,
      body: q.body,
      at: null,
    });
  }

  // Newest first when dated; undated (quotes) last
  return items.sort((a, b) => {
    if (a.at && b.at) return b.at.localeCompare(a.at);
    if (a.at && !b.at) return -1;
    if (!a.at && b.at) return 1;
    return 0;
  });
}
