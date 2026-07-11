import { buildDashboardSnapshot } from "@/lib/dashboard/stats";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { getClients } from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import { getPayments } from "@/lib/payments/repository";
import { getProjects } from "@/lib/projects/repository";
import { refreshAllDomainData } from "@/lib/supabase/refresh-all";
import { getWorkspaceSummaries } from "@/lib/workspaces/repository";

/** Assemble executive dashboard from repositories + pure aggregations. */
export function getDashboardSnapshot(): DashboardSnapshot {
  return buildDashboardSnapshot({
    projects: getProjects(),
    orders: getOrders(),
    clients: getClients(),
    payments: getPayments(),
    workspaceSummaries: getWorkspaceSummaries(),
  });
}

/** Refresh all Supabase caches then assemble dashboard. */
export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  await refreshAllDomainData();
  return getDashboardSnapshot();
}
