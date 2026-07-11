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

/** Format a Date as local YYYY-MM-DD. */
export function formatLocalDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Studio "today" in local calendar time (YYYY-MM-DD).
 * Override: explicit `override` param, or env `SODA_BUSINESS_TODAY` /
 * `NEXT_PUBLIC_SODA_BUSINESS_TODAY` (for tests / demos).
 */
export function getBusinessToday(override?: string): string {
  if (override?.trim()) return override.trim().slice(0, 10);
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.SODA_BUSINESS_TODAY?.trim() ||
        process.env.NEXT_PUBLIC_SODA_BUSINESS_TODAY?.trim()
      : undefined;
  if (fromEnv) return fromEnv.slice(0, 10);
  return formatLocalDate(new Date());
}

/**
 * Studio "now" as ISO timestamp.
 * Same override / env rules as getBusinessToday; date-only overrides use noon local.
 */
export function getBusinessNowIso(override?: string): string {
  if (override?.trim()) {
    const raw = override.trim();
    if (raw.includes("T")) return new Date(raw).toISOString();
    return new Date(`${raw.slice(0, 10)}T12:00:00`).toISOString();
  }
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.SODA_BUSINESS_TODAY?.trim() ||
        process.env.NEXT_PUBLIC_SODA_BUSINESS_TODAY?.trim()
      : undefined;
  if (fromEnv) {
    return new Date(`${fromEnv.slice(0, 10)}T12:00:00`).toISOString();
  }
  return new Date().toISOString();
}

/** @deprecated Prefer getBusinessToday() — live local date (env override supported). */
export const BUSINESS_TODAY: string = getBusinessToday();

/** @deprecated Prefer getBusinessNowIso() — live timestamp (env override supported). */
export const BUSINESS_NOW_ISO: string = getBusinessNowIso();
