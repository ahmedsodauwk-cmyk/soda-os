"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  sanitizeActionError,
  type DomainActionResult,
} from "@/lib/domain/types";
import {
  assertClientAccess,
  requirePermission,
} from "@/lib/domain/mutation-auth";
import {
  createClient,
  deleteClient,
  refreshClients,
  updateClient,
} from "@/lib/clients/repository";
import type { Client, NewClientInput } from "@/lib/clients/types";

const CLIENT_PATCH_KEYS = new Set([
  "type",
  "segment",
  "businessRole",
  "name",
  "phone",
  "whatsapp",
  "email",
  "contactPerson",
  "company",
  "logoUrl",
  "avatarUrl",
  "notes",
  "contacts",
  "isActive",
] as const);

function pickClientPatch(
  patch: Partial<NewClientInput> & { isActive?: boolean }
): Partial<NewClientInput> & { isActive?: boolean } {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (CLIENT_PATCH_KEYS.has(key as keyof NewClientInput | "isActive")) {
      next[key] = value;
    }
  }
  return next as Partial<NewClientInput> & { isActive?: boolean };
}

function revalidateClients(clientId?: string) {
  revalidatePath("/clients");
  revalidatePath("/commercial");
  if (clientId) {
    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/clients/${clientId}`, "layout");
  }
}

export async function createClientAction(
  input: NewClientInput
): Promise<DomainActionResult<Client>> {
  const gate = await requirePermission("clients.manage");
  if (!gate.ok) return actionError(gate.error);

  try {
    const client = await createClient(input);
    await refreshClients();
    revalidateClients(client.id);
    return { ok: true, data: client };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function updateClientAction(
  clientId: string,
  patch: Partial<NewClientInput> & { isActive?: boolean }
): Promise<DomainActionResult<Client>> {
  const gate = await assertClientAccess(clientId, "clients.edit");
  if (!gate.ok) return actionError(gate.error);

  const safePatch = pickClientPatch(patch);
  if (Object.keys(safePatch).length === 0) {
    return actionError("No valid fields to update.");
  }

  try {
    const client = await updateClient(clientId, safePatch);
    await refreshClients();
    revalidateClients(clientId);
    return { ok: true, data: client };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function createClientInlineAction(input: {
  name: string;
  phone: string;
  whatsapp?: string;
  projectType: import("@/lib/orders/types").ProjectType;
}): Promise<DomainActionResult<Client>> {
  const gate = await requirePermission("clients.manage");
  if (!gate.ok) return actionError(gate.error);

  const name = input.name.trim();
  const phone = input.phone.trim();
  if (!name) return actionError("Client name is required.");
  if (!phone) return actionError("Phone is required when creating a client.");

  const segment =
    input.projectType === "Wedding" || input.projectType === "Engagement"
      ? "wedding"
      : "commercial";

  return createClientAction({
    type: segment === "commercial" ? "company" : "individual",
    segment,
    name,
    phone,
    whatsapp: (input.whatsapp ?? phone).trim(),
  });
}

export async function deleteClientAction(
  clientId: string
): Promise<DomainActionResult> {
  const gate = await assertClientAccess(clientId, "clients.manage");
  if (!gate.ok) return actionError(gate.error);

  try {
    await deleteClient(clientId);
    await refreshClients();
    revalidateClients();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}
