import type { Project } from "@/lib/projects/types";
import {
  getAllProjectSeeds,
  getProjectSeedById,
} from "@/lib/projects/repository";

/** Raw project seeds — no computed enrichment. */
export function getProjectSeeds(): Project[] {
  return getAllProjectSeeds();
}

export function getProjectSeedByIdAlias(id: string): Project | undefined {
  return getProjectSeedById(id);
}

export { getProjectSeedById };
