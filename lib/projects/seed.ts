import { mockProjects } from "@/lib/projects/mock-data";
import type { Project } from "@/lib/projects/types";

/** Raw project seeds — no computed enrichment. */
export function getProjectSeeds(): Project[] {
  return mockProjects;
}

export function getProjectSeedById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id);
}
