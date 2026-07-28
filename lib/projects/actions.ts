"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  sanitizeActionError,
  type DomainActionResult,
} from "@/lib/domain/types";
import {
  isClientIdInScope,
  requireFounderMutationAccess,
  requirePermission,
} from "@/lib/domain/mutation-auth";
import {
  createProject,
  deleteProject,
  fetchProjectById,
  refreshProjects,
  updateProject,
} from "@/lib/projects/repository";
import type { Project, ProjectStatus } from "@/lib/projects/types";
import { refreshClients } from "@/lib/clients/repository";

function revalidateProjects(projectId?: string) {
  revalidatePath("/projects");
  revalidatePath("/commercial");
  revalidatePath("/workspaces");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}`, "layout");
  }
}

async function assertProjectAccess(
  projectId: string,
  permission: "projects.edit" | "projects.view"
): Promise<
  | { ok: true; project: Project }
  | { ok: false; error: string }
> {
  const gate = await requirePermission(permission);
  if (!gate.ok) return gate;

  const project = await fetchProjectById(projectId);
  if (!project) return { ok: false, error: "Project not found." };

  if (!isClientIdInScope(project.clientId, gate.scope)) {
    return { ok: false, error: "Project not in scope." };
  }
  return { ok: true, project };
}

export async function createProjectAction(
  input: Omit<Project, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<DomainActionResult<Project>> {
  const gate = await requirePermission("projects.edit");
  if (!gate.ok) return actionError(gate.error);
  if (!isClientIdInScope(input.clientId, gate.scope)) {
    return actionError("Client not in scope.");
  }

  try {
    const project = await createProject(input);
    await Promise.all([refreshClients(), refreshProjects()]);
    revalidateProjects(project.id);
    return { ok: true, data: project };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function updateProjectAction(
  projectId: string,
  patch: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">> & {
    status?: ProjectStatus;
  }
): Promise<DomainActionResult<Project>> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  const access = await assertProjectAccess(projectId, "projects.view");
  if (!access.ok) return actionError(access.error);

  const safePatch: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">> & {
    status?: ProjectStatus;
  } = {};
  if (patch.status !== undefined) safePatch.status = patch.status;
  if (patch.name !== undefined) safePatch.name = patch.name;
  if (patch.description !== undefined) safePatch.description = patch.description;
  if (patch.team !== undefined) safePatch.team = patch.team;
  if (patch.isActive !== undefined) safePatch.isActive = patch.isActive;

  if (Object.keys(safePatch).length === 0) {
    return actionError("No valid fields to update.");
  }

  try {
    const project = await updateProject(projectId, safePatch);
    await refreshProjects();
    revalidateProjects(projectId);
    return { ok: true, data: project };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function deleteProjectAction(
  projectId: string
): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  const access = await assertProjectAccess(projectId, "projects.view");
  if (!access.ok) return actionError(access.error);

  try {
    await deleteProject(projectId);
    await refreshProjects();
    revalidateProjects();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}
