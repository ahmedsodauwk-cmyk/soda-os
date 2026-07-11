import { getDashboardFromBusinessCore } from "@/lib/core/rules/aggregators";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { refreshAllDomainData } from "@/lib/supabase/refresh-all";

/**
 * Dashboard reads ONLY from Business Core aggregators.
 * Pages must not invent ad-hoc KPI math.
 */
export function getDashboardSnapshot(): DashboardSnapshot {
  return getDashboardFromBusinessCore();
}

/** Refresh all Supabase caches then assemble dashboard via Business Core. */
export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  await refreshAllDomainData();
  return getDashboardFromBusinessCore();
}
