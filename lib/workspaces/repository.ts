import { computeWorkspaceStats } from "@/lib/business/workspace-stats";
import { getOrders } from "@/lib/orders/repository";
import { getProjectsByWorkspace, getProjects } from "@/lib/projects/repository";
import {
  averageProgress,
  latestActivity,
  uniqueTeamCount,
} from "@/lib/projects/utils";
import { getWorkspaces } from "@/lib/taxonomy/repository";
import type { WorkspaceSummary } from "@/lib/workspaces/types";
import { WORKSPACE_DISPLAY_LABELS } from "@/lib/workspaces/types";

export function getWorkspaceDisplayLabel(workspaceId: string, fallback: string) {
  return WORKSPACE_DISPLAY_LABELS[workspaceId] ?? fallback;
}

export function getWorkspaceSummaries(): WorkspaceSummary[] {
  const workspaces = getWorkspaces();
  const allOrders = getOrders();

  return workspaces.map((workspace) => {
    const projects = getProjectsByWorkspace(workspace.id);
    const stats = computeWorkspaceStats(workspace.id, projects, allOrders);
    const upcomingShootsCount = projects.reduce(
      (acc, p) => acc + p.upcomingShoots.length,
      0
    );

    return {
      id: workspace.id,
      label: getWorkspaceDisplayLabel(workspace.id, workspace.label),
      slug: workspace.slug,
      description: workspace.description,
      color: workspace.color,
      icon: workspace.icon,
      projectCount: stats.projects,
      progress: averageProgress(projects),
      lastActivity: latestActivity(projects),
      revenue: stats.revenue,
      ordersCount: stats.activeOrders,
      activeClients: stats.activeClients,
      teamCount: uniqueTeamCount(projects),
      upcomingShootsCount,
    };
  });
}

export function getWorkspaceSummaryById(
  id: string
): WorkspaceSummary | undefined {
  return getWorkspaceSummaries().find((w) => w.id === id || w.slug === id);
}

export function filterWorkspaceSummaries(
  summaries: WorkspaceSummary[],
  search: string
): WorkspaceSummary[] {
  const query = search.trim().toLowerCase();
  if (!query) return summaries;

  return summaries.filter((w) => {
    const searchable = [w.label, w.description ?? "", w.id, w.slug]
      .join(" ")
      .toLowerCase();
    return searchable.includes(query);
  });
}

/** All projects across workspaces — used for global search on workspaces page */
export function getAllActiveProjects() {
  return getProjects();
}
