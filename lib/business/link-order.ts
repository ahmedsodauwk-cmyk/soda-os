import {
  createClient,
  getAllClients,
  getClientById,
} from "@/lib/clients/repository";
import type { Client } from "@/lib/clients/types";
import type { NewOrderInput, Order } from "@/lib/orders/types";
import { workspaceIdFromProjectType } from "@/lib/orders/utils";
import {
  cacheProject,
  createProject,
  getAllProjectSeeds,
  getProjectSeedById,
} from "@/lib/projects/repository";
import type { Project, ProjectStatus } from "@/lib/projects/types";
import { ensureTaxonomyPersisted } from "@/lib/taxonomy/persist";

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
  if (explicit && getClientById(explicit)) return explicit;

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

async function resolveOrCreateClientId(
  clientName: string,
  phone: string,
  projectType: Order["projectType"],
  explicit?: string
): Promise<string> {
  const existing = resolveClientId(clientName, phone, explicit);
  if (existing) return existing;

  const segment =
    projectType === "Wedding" || projectType === "Engagement"
      ? "wedding"
      : "commercial";
  const client = await createClient({
    type: segment === "commercial" ? "company" : "individual",
    segment,
    name: clientName.trim(),
    phone: phone || "",
  });
  return client.id;
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
 * If missing, creates a lightweight Project in Supabase and links it.
 */
export async function ensureOrderProjectLink(
  orderId: string,
  input: NewOrderInput
): Promise<Pick<Order, "projectId" | "clientId" | "workspaceId">> {
  void orderId;
  await ensureTaxonomyPersisted();

  const workspaceId =
    input.workspaceId || workspaceIdFromProjectType(input.projectType);
  const clientId = await resolveOrCreateClientId(
    input.clientName,
    input.phone,
    input.projectType,
    input.clientId
  );

  if (input.projectId) {
    const existing = getProjectSeedById(input.projectId);
    if (existing) {
      return {
        projectId: input.projectId,
        clientId: clientId ?? existing.clientId,
        workspaceId: existing.workspaceId || workspaceId,
      };
    }
    return {
      projectId: input.projectId,
      clientId,
      workspaceId,
    };
  }

  const now = new Date().toISOString();
  const project = await createProject({
    name: `${input.clientName} — ${input.projectType}`,
    workspaceId,
    subcategoryId: input.subcategoryId,
    clientName: input.clientName,
    clientId,
    status: mapOrderStatusToProjectStatus(input.status),
    progress: 0,
    ordersCount: 0,
    revenue: 0,
    team: [],
    upcomingShoots: [],
    lastActivity: now,
    description: input.notes,
    isActive: true,
    ...emptyHub(),
  });
  cacheProject(project);

  return { projectId: project.id, clientId, workspaceId };
}

export function findClientByName(name: string): Client | undefined {
  return getAllClients().find(
    (c) =>
      c.name.toLowerCase() === name.trim().toLowerCase() ||
      c.company?.toLowerCase() === name.trim().toLowerCase()
  );
}

/** @deprecated Prefer getAllProjectSeeds from projects repository */
export function listLinkedProjects(): Project[] {
  return getAllProjectSeeds();
}
