import { getProjectSeedById } from "@/lib/projects/seed";
import type { Order } from "@/lib/orders/types";
import type { Project } from "@/lib/projects/types";

/**
 * Canonical workspace for an order: Project.workspaceId, with Order denorm fallback.
 */
export function resolveOrderWorkspaceId(
  order: Pick<Order, "projectId" | "workspaceId">,
  project?: Pick<Project, "workspaceId"> | null
): string {
  const fromProject =
    project?.workspaceId ?? getProjectSeedById(order.projectId)?.workspaceId;
  return fromProject ?? order.workspaceId;
}

/**
 * Canonical client for an order: Project.clientId, with Order denorm fallback.
 */
export function resolveOrderClientId(
  order: Pick<Order, "projectId" | "clientId">,
  project?: Pick<Project, "clientId"> | null
): string | undefined {
  const fromProject =
    project?.clientId ?? getProjectSeedById(order.projectId)?.clientId;
  return fromProject ?? order.clientId;
}

export function resolveOrderClientName(
  order: Pick<Order, "projectId" | "clientName">,
  project?: Pick<Project, "clientName"> | null
): string {
  const fromProject =
    project?.clientName ?? getProjectSeedById(order.projectId)?.clientName;
  return fromProject ?? order.clientName;
}
