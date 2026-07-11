import type {
  Project,
  ProjectActivity,
  ProjectCalendarEvent,
  ProjectDeliverable,
  ProjectNote,
  ProjectOrderStub,
  ProjectOverview,
  ProjectStatus,
  ProjectTeamMember,
  ProjectTimelineEvent,
} from "@/lib/projects/types";
import type { JourneyStage } from "@/lib/journey/types";

export type ProjectRow = {
  id: string;
  name: string;
  workspace_id: string;
  subcategory_id: string | null;
  client_id: string;
  client_name: string;
  status: string;
  journey_stage: string | null;
  description: string | null;
  overview: unknown;
  team: unknown;
  calendar: unknown;
  timeline: unknown;
  notes: unknown;
  activity: unknown;
  deliverables: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asOverview(value: unknown): ProjectOverview {
  const o = (value ?? {}) as Record<string, unknown>;
  return {
    summary: String(o.summary ?? ""),
    milestones: Array.isArray(o.milestones)
      ? o.milestones.map(String)
      : [],
    nextAction: String(o.nextAction ?? ""),
  };
}

/** Map DB row → domain Project (computed fields zeroed; enrich later). */
export function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    workspaceId: row.workspace_id,
    ...(row.subcategory_id ? { subcategoryId: row.subcategory_id } : {}),
    clientName: row.client_name,
    clientId: row.client_id,
    status: row.status as ProjectStatus,
    ...(row.journey_stage
      ? { journeyStage: row.journey_stage as JourneyStage }
      : {}),
    progress: 0,
    ordersCount: 0,
    revenue: 0,
    team: asArray<ProjectTeamMember>(row.team),
    upcomingShoots: [],
    lastActivity: row.updated_at,
    ...(row.description ? { description: row.description } : {}),
    overview: asOverview(row.overview),
    orders: [] as ProjectOrderStub[],
    calendar: asArray<ProjectCalendarEvent>(row.calendar),
    files: [],
    payments: [],
    timeline: asArray<ProjectTimelineEvent>(row.timeline),
    notes: asArray<ProjectNote>(row.notes),
    activity: asArray<ProjectActivity>(row.activity),
    deliverables: asArray<ProjectDeliverable>(row.deliverables),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isActive: row.is_active,
  };
}

/** Persistable columns only (no computed / derived hub fields). */
export function projectToRow(project: Project): Record<string, unknown> {
  return {
    id: project.id,
    name: project.name,
    workspace_id: project.workspaceId,
    subcategory_id: project.subcategoryId ?? null,
    client_id: project.clientId,
    client_name: project.clientName,
    status: project.status,
    journey_stage: project.journeyStage ?? null,
    description: project.description ?? null,
    overview: project.overview,
    team: project.team,
    calendar: project.calendar,
    timeline: project.timeline,
    notes: project.notes,
    activity: project.activity,
    deliverables: project.deliverables,
    is_active: project.isActive,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}
