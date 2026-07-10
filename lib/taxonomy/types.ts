/**
 * Workspaces replace the legacy "category" concept.
 * UI still labels them "categories" until Phase 2+.
 *
 * Migration path: Order.categoryId → Order.workspaceId
 */

export interface Workspace {
  id: string;
  label: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  hasSubcategories: boolean;
  /** Future workspace fields */
  color?: string;
  defaultTeamId?: string;
  settings?: Record<string, unknown>;
}

export interface WorkspaceSubcategory {
  id: string;
  workspaceId: string;
  label: string;
  slug: string;
  order: number;
  isActive: boolean;
}

/** @deprecated Use Workspace — alias for migration from categoryId */
export type Category = Workspace;

/** @deprecated Use workspaceId on Order */
export type CategoryId = Workspace["id"];

/** @deprecated Use WorkspaceSubcategory */
export type Subcategory = WorkspaceSubcategory;
