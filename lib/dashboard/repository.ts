import { cache } from "react";

import { getDashboardFromBusinessCore } from "@/lib/core/rules/aggregators";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { refreshDashboardDomainData } from "@/lib/supabase/refresh-all";

/**
 * Dashboard reads ONLY from Business Core aggregators.
 * Pages must not invent ad-hoc KPI math.
 */
export function getDashboardSnapshot(): DashboardSnapshot {
  return getDashboardFromBusinessCore();
}

/**
 * Lean domain refresh (not full refreshAll) then assemble via Business Core.
 * Avoids equipment/files/closings fan-out on every Home hit.
 */
/** Per-request dedupe — Home + Brain rail share one snapshot load. */
export const loadDashboardSnapshot = cache(
  async (): Promise<DashboardSnapshot> => {
    await refreshDashboardDomainData();
    return getDashboardFromBusinessCore();
  }
);
