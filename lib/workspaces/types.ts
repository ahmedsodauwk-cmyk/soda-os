/**
 * Aggregated workspace card model for /workspaces.
 * Taxonomy Workspace remains the source of identity (id/slug/color).
 * Counts/revenue come from lib/business computed stats.
 */
export interface WorkspaceSummary {
  id: string;
  label: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  /** Computed: active projects in workspace */
  projectCount: number;
  /** Average progress across active projects (0–100) */
  progress: number;
  lastActivity: string;
  /** Computed: revenue from linked orders */
  revenue: number;
  /** Computed: active (in-pipeline) orders */
  ordersCount: number;
  /** Computed: distinct active clients with projects in workspace */
  activeClients: number;
  teamCount: number;
  upcomingShootsCount: number;
}

/** User-facing labels that differ from taxonomy seed labels */
export const WORKSPACE_DISPLAY_LABELS: Record<string, string> = {
  product: "Products",
};
