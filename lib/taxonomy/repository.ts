import { seedSubcategories, seedWorkspaces } from "@/lib/taxonomy/seed-data";
import type { Workspace, WorkspaceSubcategory } from "@/lib/taxonomy/types";

/** Primary API — workspaces replace legacy categories */
export function getWorkspaces(): Workspace[] {
  return seedWorkspaces
    .filter((w) => w.isActive)
    .sort((a, b) => a.order - b.order);
}

export function getWorkspaceById(id: string): Workspace | undefined {
  return seedWorkspaces.find((w) => w.id === id);
}

export function getSubcategories(workspaceId: string): WorkspaceSubcategory[] {
  return seedSubcategories
    .filter((s) => s.workspaceId === workspaceId && s.isActive)
    .sort((a, b) => a.order - b.order);
}

export function getSubcategoryById(
  id: string
): WorkspaceSubcategory | undefined {
  return seedSubcategories.find((s) => s.id === id);
}

/** @deprecated Use getWorkspaces — alias for category migration */
export const getCategories = getWorkspaces;

/** @deprecated Use getWorkspaceById */
export const getCategoryById = getWorkspaceById;
