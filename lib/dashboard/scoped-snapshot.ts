/**
 * Access-Level-scoped dashboard snapshot (Mission 04.5).
 * Founder → Business Core company snapshot.
 * Others → buildDashboardSnapshot on scoped domain rows only (no finance payments).
 */

import { getClients } from "@/lib/clients/repository";
import { getDashboardFromBusinessCore } from "@/lib/core/rules/aggregators";
import { buildDashboardSnapshot } from "@/lib/dashboard/stats";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import {
  buildDataScope,
  scopeClients,
  scopeOrders,
  scopeProjects,
  type DataScope,
} from "@/lib/identity/data-scope";
import type { SodaSession } from "@/lib/identity/session";
import { getOrders } from "@/lib/orders/repository";
import { getProjects } from "@/lib/projects/repository";
import { refreshDashboardDomainData } from "@/lib/supabase/refresh-all";
import { getWorkspaceSummaries } from "@/lib/workspaces/repository";

export type ScopedDashboardResult = {
  dashboard: DashboardSnapshot;
  scope: DataScope;
};

export async function loadScopedDashboardSnapshot(
  session: SodaSession
): Promise<ScopedDashboardResult> {
  await refreshDashboardDomainData();

  const allOrders = getOrders();
  const allClients = getClients();
  const scope = buildDataScope(session, {
    orders: allOrders,
    clients: allClients,
  });

  if (session.profile.accessLevel === "founder") {
    return {
      dashboard: getDashboardFromBusinessCore(),
      scope,
    };
  }

  const scopedOrders = scopeOrders(allOrders, scope);
  const scopedClients = scopeClients(allClients, scope);
  const scopedProjects = scopeProjects(getProjects(), scope);

  const dashboard = buildDashboardSnapshot({
    projects: scopedProjects,
    orders: scopedOrders,
    clients: scopedClients,
    payments: [],
    workspaceSummaries: getWorkspaceSummaries(),
  });

  return { dashboard, scope };
}
