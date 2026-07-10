import {
  computeProjectStats,
  toProjectOrderStub,
} from "@/lib/business/project-stats";
import { getOrdersByProject } from "@/lib/orders/repository";
import { mockProjects } from "@/lib/projects/mock-data";
import type { Project } from "@/lib/projects/types";
import { getProjectSeedById, getProjectSeeds } from "@/lib/projects/seed";

function enrichProject(seed: Project): Project {
  const orders = getOrdersByProject(seed.id);
  const stats = computeProjectStats(seed, orders);

  return {
    ...seed,
    ordersCount: stats.ordersCount,
    revenue: stats.revenue,
    progress: stats.progress,
    team: stats.assignedTeam,
    upcomingShoots: stats.upcomingShoots,
    lastActivity: stats.lastActivity,
    orders:
      orders.length > 0 ? orders.map(toProjectOrderStub) : seed.orders,
  };
}

export function getProjects(): Project[] {
  return getProjectSeeds()
    .filter((p) => p.isActive)
    .map(enrichProject);
}

export function getProjectById(id: string): Project | undefined {
  const seed = getProjectSeedById(id);
  if (!seed) return undefined;
  return enrichProject(seed);
}

export function getProjectsByWorkspace(workspaceId: string): Project[] {
  return getProjects().filter((p) => p.workspaceId === workspaceId);
}

export function getProjectsByClient(clientId: string): Project[] {
  return getProjects().filter((p) => p.clientId === clientId);
}

/** All seeds including inactive — used when creating linked entities */
export function getAllProjectSeeds(): Project[] {
  return [...mockProjects];
}
