import type { WorkspaceComputedStats } from "@/lib/business/types";
import type { Order } from "@/lib/orders/types";
import { isOrderActiveWorkload, isOrderBillable } from "@/lib/orders/status";
import type { Project } from "@/lib/projects/types";

export function computeWorkspaceStats(
  workspaceId: string,
  projects: Project[],
  orders: Order[]
): WorkspaceComputedStats {
  const workspaceProjects = projects.filter(
    (p) => p.workspaceId === workspaceId && p.isActive
  );
  const projectIds = new Set(workspaceProjects.map((p) => p.id));

  const workspaceOrders = orders.filter(
    (o) =>
      o.workspaceId === workspaceId ||
      (o.projectId && projectIds.has(o.projectId))
  );

  const activeClientIds = new Set(
    workspaceProjects
      .filter((p) => p.status === "Active" || p.status === "OnHold")
      .map((p) => p.clientId)
      .filter((id): id is string => Boolean(id))
  );

  const revenue = workspaceOrders
    .filter((o) => isOrderBillable(o.status))
    .reduce((acc, o) => acc + o.price, 0);

  const activeOrders = workspaceOrders.filter((o) =>
    isOrderActiveWorkload(o.status)
  ).length;

  return {
    projects: workspaceProjects.length,
    activeClients: activeClientIds.size,
    revenue,
    activeOrders,
  };
}
