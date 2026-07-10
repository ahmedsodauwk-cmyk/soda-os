import { getAllClients } from "@/lib/clients/repository";
import type { Client } from "@/lib/clients/types";
import type { NewOrderInput, Order } from "@/lib/orders/types";
import { workspaceIdFromProjectType } from "@/lib/orders/utils";
import { mockProjects } from "@/lib/projects/mock-data";
import type { Project, ProjectStatus } from "@/lib/projects/types";

function mapOrderStatusToProjectStatus(status: Order["status"]): ProjectStatus {
  switch (status) {
    case "Delivered":
      return "Completed";
    case "Cancelled":
      return "Cancelled";
    default:
      return "Active";
  }
}

function resolveClientId(
  clientName: string,
  phone: string,
  explicit?: string
): string | undefined {
  if (explicit) return explicit;

  const clients = getAllClients();
  const byName = clients.find(
    (c) =>
      c.name.toLowerCase() === clientName.trim().toLowerCase() ||
      c.company?.toLowerCase() === clientName.trim().toLowerCase()
  );
  if (byName) return byName.id;

  const byPhone = clients.find((c) => c.phone === phone);
  return byPhone?.id;
}

function emptyHub(): Pick<
  Project,
  | "overview"
  | "orders"
  | "calendar"
  | "files"
  | "payments"
  | "timeline"
  | "notes"
  | "activity"
  | "deliverables"
> {
  return {
    overview: {
      summary: "",
      milestones: [],
      nextAction: "",
    },
    orders: [],
    calendar: [],
    files: [],
    payments: [],
    timeline: [],
    notes: [],
    activity: [],
    deliverables: [],
  };
}

/**
 * Ensure an order has projectId (+ optional clientId).
 * If missing, creates a lightweight Project seed and links it.
 * Mutates mockProjects in memory for the session.
 */
export function ensureOrderProjectLink(
  orderId: string,
  input: NewOrderInput
): Pick<Order, "projectId" | "clientId" | "workspaceId"> {
  const workspaceId =
    input.workspaceId || workspaceIdFromProjectType(input.projectType);
  const clientId = resolveClientId(
    input.clientName,
    input.phone,
    input.clientId
  );

  if (input.projectId) {
    return {
      projectId: input.projectId,
      clientId,
      workspaceId,
    };
  }

  const nextIndex = mockProjects.length + 1;
  const projectId = `PRJ-2026-${String(nextIndex).padStart(4, "0")}`;
  const now = new Date().toISOString();

  const project: Project = {
    id: projectId,
    name: `${input.clientName} — ${input.projectType}`,
    workspaceId,
    subcategoryId: input.subcategoryId,
    clientName: input.clientName,
    clientId: clientId ?? "client-unknown",
    status: mapOrderStatusToProjectStatus(input.status),
    progress: 0,
    ordersCount: 0,
    revenue: 0,
    team: [],
    upcomingShoots: [],
    lastActivity: now,
    description: input.notes,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    ...emptyHub(),
  };

  mockProjects.unshift(project);

  return { projectId, clientId, workspaceId };
}

export function findClientByName(name: string): Client | undefined {
  return getAllClients().find(
    (c) =>
      c.name.toLowerCase() === name.trim().toLowerCase() ||
      c.company?.toLowerCase() === name.trim().toLowerCase()
  );
}
