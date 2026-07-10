/**
 * Aggregated workspace card model for /workspaces.
 * Taxonomy Workspace remains the source of identity (id/slug/color).
 */
export interface WorkspaceSummary {
  id: string;
  label: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  projectCount: number;
  /** Average progress across active projects (0–100) */
  progress: number;
  lastActivity: string;
  revenue: number;
  ordersCount: number;
  teamCount: number;
  upcomingShootsCount: number;
}

/** User-facing labels that differ from taxonomy seed labels */
export const WORKSPACE_DISPLAY_LABELS: Record<string, string> = {
  product: "Products",
};
