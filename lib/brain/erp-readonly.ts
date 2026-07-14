/**
 * ERP Read-Only Panel for SODA Brain.
 * READS dashboard / calendar summaries only. NEVER writes Orders/Clients/Finance/etc.
 */

import { loadDashboardSnapshot } from "@/lib/dashboard/repository";
import type { BrainErpReadonlySummary } from "@/lib/brain/types";

/**
 * Optional panel data. Failures return empty summary — Brain stays usable offline from ERP.
 */
export async function loadBrainErpReadonlySummary(): Promise<BrainErpReadonlySummary> {
  try {
    const snap = await loadDashboardSnapshot();
    const todayOrders = snap.schedule.todayShoots.map((s) => ({
      id: s.orderId,
      clientName: s.clientName,
      status: String(s.status),
      shootDate: s.date,
    }));

    const upcomingShoots = [
      ...snap.schedule.todayShoots,
      ...snap.schedule.tomorrowShoots,
    ]
      .slice(0, 8)
      .map((s) => ({
        id: s.orderId,
        title: s.title,
        clientName: s.clientName,
        date: s.date,
      }));

    const crewWorkingToday = snap.team
      .filter((t) => t.currentWorkload > 0)
      .slice(0, 8)
      .map((t) => ({
        name: t.name,
        role: t.role,
        workload: t.currentWorkload,
      }));

    return {
      asOf: snap.asOf,
      todayOrders,
      upcomingShoots,
      revenueSummary: {
        revenueThisMonth: snap.kpis.revenueThisMonth,
        outstanding: snap.financial.outstanding,
        collected: snap.financial.collected,
      },
      crewWorkingToday,
      calendarSummary: {
        todayShoots: snap.schedule.todayShoots.length,
        tomorrowShoots: snap.schedule.tomorrowShoots.length,
        deliveries: snap.schedule.deliveries.length,
        deadlines: snap.schedule.deadlines.length,
      },
    };
  } catch (err) {
    console.error(
      "[brain] ERP read-only panel failed:",
      err instanceof Error ? err.message : err
    );
    const asOf = new Date().toISOString().slice(0, 10);
    return {
      asOf,
      todayOrders: [],
      upcomingShoots: [],
      revenueSummary: {
        revenueThisMonth: 0,
        outstanding: 0,
        collected: 0,
      },
      crewWorkingToday: [],
      calendarSummary: {
        todayShoots: 0,
        tomorrowShoots: 0,
        deliveries: 0,
        deadlines: 0,
      },
    };
  }
}
