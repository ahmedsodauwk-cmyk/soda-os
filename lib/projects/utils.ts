import type { Project, ProjectStatus } from "@/lib/projects/types";

export function formatRelativeActivity(iso: string): string {
  const date = new Date(iso);
  const now = new Date("2026-07-10T12:00:00Z");
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function filterProjects(
  projects: Project[],
  search: string,
  statusFilter: string = "all",
  workspaceFilter: string = "all"
): Project[] {
  const query = search.trim().toLowerCase();

  return projects.filter((project) => {
    if (statusFilter !== "all" && project.status !== statusFilter) {
      return false;
    }

    if (workspaceFilter !== "all" && project.workspaceId !== workspaceFilter) {
      return false;
    }

    if (!query) return true;

    const searchable = [
      project.name,
      project.clientName,
      project.id,
      project.status,
      project.description ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });
}

export function averageProgress(projects: Project[]): number {
  if (projects.length === 0) return 0;
  const sum = projects.reduce((acc, p) => acc + p.progress, 0);
  return Math.round(sum / projects.length);
}

export function uniqueTeamCount(projects: Project[]): number {
  const ids = new Set<string>();
  for (const project of projects) {
    for (const member of project.team) {
      ids.add(member.id);
    }
  }
  return ids.size;
}

export function latestActivity(projects: Project[]): string {
  if (projects.length === 0) return new Date(0).toISOString();
  return projects.reduce((latest, p) =>
    p.lastActivity > latest ? p.lastActivity : latest
  , projects[0].lastActivity);
}

export function isProjectStatus(value: string): value is ProjectStatus {
  return (
    value === "Active" ||
    value === "OnHold" ||
    value === "Completed" ||
    value === "Cancelled"
  );
}
