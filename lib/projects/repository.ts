import {
  computeProjectStats,
  toProjectOrderStub,
} from "@/lib/business/project-stats";
import { getProjectJourneyStage } from "@/lib/journey/seed";
import { getOrdersByProject } from "@/lib/orders/repository";
import { getPaymentsByProject } from "@/lib/payments/repository";
import { createProjectsDb } from "@/lib/projects/db";
import {
  projectToRow,
  rowToProject,
  type ProjectRow,
} from "@/lib/projects/mappers";
import type { Project } from "@/lib/projects/types";
import { ensureTaxonomyPersisted } from "@/lib/taxonomy/persist";

let projectsCache: Project[] = [];

function setCache(projects: Project[]): Project[] {
  projectsCache = [...projects];
  return projectsCache;
}

function upsertCache(project: Project): void {
  projectsCache = [project, ...projectsCache.filter((p) => p.id !== project.id)];
}

function enrichProject(seed: Project): Project {
  const orders = getOrdersByProject(seed.id);
  const stats = computeProjectStats(seed, orders);
  const payments = getPaymentsByProject(seed.id).map((p) => ({
    id: p.id,
    label: p.label ?? p.kind,
    amount: p.amount,
    kind: p.kind,
    status: p.status,
    paidAt: p.paidAt,
  }));

  return {
    ...seed,
    journeyStage:
      seed.journeyStage ?? getProjectJourneyStage(seed.id, "Inquiry"),
    ordersCount: stats.ordersCount,
    revenue: stats.revenue,
    progress: stats.progress,
    team: stats.assignedTeam.length > 0 ? stats.assignedTeam : seed.team,
    upcomingShoots: stats.upcomingShoots,
    lastActivity: stats.lastActivity,
    orders:
      orders.length > 0 ? orders.map(toProjectOrderStub) : seed.orders,
    payments: payments.length > 0 ? payments : seed.payments,
  };
}

export async function refreshProjects(): Promise<Project[]> {
  await ensureTaxonomyPersisted();
  const db = createProjectsDb();
  const { data, error } = await db
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load projects: ${error.message}`);
  }
  const raw = ((data ?? []) as ProjectRow[]).map(rowToProject);
  return setCache(raw);
}

export function getProjects(): Project[] {
  return projectsCache.filter((p) => p.isActive).map(enrichProject);
}

export function getProjectById(id: string): Project | undefined {
  const seed = projectsCache.find((p) => p.id === id);
  if (!seed) return undefined;
  return enrichProject(seed);
}

export async function fetchProjectById(
  id: string
): Promise<Project | undefined> {
  const db = createProjectsDb();
  const { data, error } = await db
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load project ${id}: ${error.message}`);
  }
  if (!data) return undefined;
  const project = rowToProject(data as ProjectRow);
  upsertCache(project);
  return enrichProject(project);
}

export function getProjectsByWorkspace(workspaceId: string): Project[] {
  return getProjects().filter((p) => p.workspaceId === workspaceId);
}

export function getProjectsByClient(clientId: string): Project[] {
  return getProjects().filter((p) => p.clientId === clientId);
}

/** All cached projects including inactive. */
export function getAllProjectSeeds(): Project[] {
  return [...projectsCache];
}

export function getProjectSeeds(): Project[] {
  return [...projectsCache];
}

export function getProjectSeedById(id: string): Project | undefined {
  return projectsCache.find((p) => p.id === id);
}

function newProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `PRJ-${crypto.randomUUID()}`;
  }
  return `PRJ-${Date.now().toString(36)}`;
}

/** Persist a new project. */
export async function createProject(
  input: Omit<Project, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<Project> {
  await ensureTaxonomyPersisted();
  const now = new Date().toISOString();
  const project: Project = {
    ...input,
    id: input.id ?? newProjectId(),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };

  const db = createProjectsDb();
  const { data, error } = await db
    .from("projects")
    .insert(projectToRow(project))
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }
  const saved = rowToProject(data as ProjectRow);
  upsertCache(saved);
  return enrichProject(saved);
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, "id" | "createdAt">>
): Promise<Project> {
  const existing = getProjectSeedById(id) ?? (await fetchProjectById(id));
  if (!existing) throw new Error(`Project not found: ${id}`);
  const now = new Date().toISOString();
  const merged: Project = {
    ...existing,
    ...patch,
    id,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
  const db = createProjectsDb();
  const row = projectToRow(merged);
  delete row.id;
  delete row.created_at;
  const { data, error } = await db
    .from("projects")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }
  const saved = rowToProject(data as ProjectRow);
  upsertCache(saved);
  return enrichProject(saved);
}

export async function deleteProject(id: string): Promise<void> {
  const db = createProjectsDb();
  const { error } = await db.from("projects").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
  projectsCache = projectsCache.filter((p) => p.id !== id);
}

/** Upsert into cache only (used when another module already wrote the row). */
export function cacheProject(project: Project): void {
  upsertCache(project);
}
