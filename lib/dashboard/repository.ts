import { getClients } from "@/lib/clients/repository";
import { buildDashboardSnapshot } from "@/lib/dashboard/stats";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { getOrders } from "@/lib/orders/repository";
import { getPayments } from "@/lib/payments/repository";
import { getProjects } from "@/lib/projects/repository";
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
