import { mockProjects } from "@/lib/projects/mock-data";
import type { Project } from "@/lib/projects/types";

export function getProjects(): Project[] {
  return mockProjects.filter((p) => p.isActive);
}

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id);
}

export function getProjectsByWorkspace(workspaceId: string): Project[] {
  return getProjects().filter((p) => p.workspaceId === workspaceId);
}
