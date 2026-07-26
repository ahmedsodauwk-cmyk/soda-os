"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  sanitizeActionError,
  type DomainActionResult,
} from "@/lib/domain/types";
import {
  assertOrderAccess,
  isClientIdInScope,
  requirePermission,
} from "@/lib/domain/mutation-auth";
import {
  createDelivery,
  createInvoice,
  refreshInvoices,
} from "@/lib/invoices/repository";
import type { Invoice, OrderDelivery } from "@/lib/invoices/types";
import { fetchProjectById } from "@/lib/projects/repository";

function revalidateInvoices(projectId?: string) {
  revalidatePath("/projects");
  revalidatePath("/commercial");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}`, "layout");
  }
}

async function assertInvoiceProjectAccess(
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requirePermission("finance.edit");
  if (!gate.ok) return gate;

  const project = await fetchProjectById(projectId);
  if (!project) return { ok: false, error: "Project not found." };
  if (!isClientIdInScope(project.clientId, gate.scope)) {
    return { ok: false, error: "Project not in scope." };
  }
  return { ok: true };
}

export async function createInvoiceAction(
  input: Omit<Invoice, "id"> & { id?: string }
): Promise<DomainActionResult<Invoice>> {
  if (!input.projectId) return actionError("Project id required.");
  const access = await assertInvoiceProjectAccess(input.projectId);
  if (!access.ok) return actionError(access.error);

  if (input.orderId) {
    const orderGate = await assertOrderAccess(input.orderId, "orders.finance");
    if (!orderGate.ok) return actionError(orderGate.error);
  }

  try {
    const invoice = await createInvoice(input);
    await refreshInvoices();
    revalidateInvoices(input.projectId);
    return { ok: true, data: invoice };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function createDeliveryAction(
  input: Omit<OrderDelivery, "id"> & { id?: string }
): Promise<DomainActionResult<OrderDelivery>> {
  const access = await assertInvoiceProjectAccess(input.projectId);
  if (!access.ok) return actionError(access.error);

  const orderGate = await assertOrderAccess(input.orderId, "orders.edit");
  if (!orderGate.ok) return actionError(orderGate.error);

  try {
    const delivery = await createDelivery(input);
    await refreshInvoices();
    revalidateInvoices(input.projectId);
    return { ok: true, data: delivery };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}
