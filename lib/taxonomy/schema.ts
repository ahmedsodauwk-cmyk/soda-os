import type { Workspace, WorkspaceSubcategory } from "@/lib/taxonomy/types";

export interface WorkspaceShape {
  id: string;
  label: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  hasSubcategories: boolean;
  color?: string;
  defaultTeamId?: string;
  settings?: Record<string, unknown>;
}

export interface WorkspaceSubcategoryShape {
  id: string;
  workspaceId: string;
  label: string;
  slug: string;
  order: number;
  isActive: boolean;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function validateWorkspace(data: unknown): data is Workspace {
  if (!data || typeof data !== "object") return false;
  const w = data as Record<string, unknown>;
  return (
    typeof w.id === "string" &&
    typeof w.label === "string" &&
    typeof w.slug === "string" &&
    isValidSlug(w.slug) &&
    typeof w.order === "number" &&
    typeof w.isActive === "boolean" &&
    typeof w.hasSubcategories === "boolean"
  );
}

export function validateWorkspaceSubcategory(
  data: unknown
): data is WorkspaceSubcategory {
  if (!data || typeof data !== "object") return false;
  const s = data as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.workspaceId === "string" &&
    typeof s.label === "string" &&
    typeof s.slug === "string" &&
    isValidSlug(s.slug) &&
    typeof s.order === "number" &&
    typeof s.isActive === "boolean"
  );
}

export const workspaceRequiredKeys: (keyof WorkspaceShape)[] = [
  "id",
  "label",
  "slug",
  "order",
  "isActive",
  "hasSubcategories",
];

export const subcategoryRequiredKeys: (keyof WorkspaceSubcategoryShape)[] = [
  "id",
  "workspaceId",
  "label",
  "slug",
  "order",
  "isActive",
];
