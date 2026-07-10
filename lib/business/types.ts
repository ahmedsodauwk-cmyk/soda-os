import type { ProjectShoot, ProjectTeamMember } from "@/lib/projects/types";
import type { Project } from "@/lib/projects/types";

/** Computed exposures for every Project (never hardcode in seed). */
export interface ProjectComputedStats {
  ordersCount: number;
  revenue: number;
  progress: number;
  assignedTeam: ProjectTeamMember[];
  upcomingShoot: ProjectShoot | null;
  upcomingShoots: ProjectShoot[];
  lastActivity: string;
}

/** Computed exposures for every Client. */
export interface ClientComputedStats {
  activeProjects: number;
  totalOrders: number;
  revenue: number;
  lastProject: Pick<Project, "id" | "name" | "updatedAt" | "status"> | null;
  outstandingBalance: number;
}

/** Computed exposures for every Workspace. */
export interface WorkspaceComputedStats {
  projects: number;
  activeClients: number;
  revenue: number;
  activeOrders: number;
}

/** Reference "now" for upcoming-shoot / relative activity (mock clock). */
export const BUSINESS_NOW_ISO = "2026-07-10T12:00:00Z";
export const BUSINESS_TODAY = "2026-07-10";
