"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  sanitizeActionError,
  type DomainActionResult,
} from "@/lib/domain/types";
import {
  requireFounder,
  requireFounderMutationAccess,
} from "@/lib/domain/mutation-auth";
import {
  applyOrderStatus,
  createSmartOrder,
  updateSmartOrder,
  type SmartOrderResult,
} from "@/lib/orders/engine";
import { deleteOrder, refreshOrders } from "@/lib/orders/repository";
import type { OrderStatus, SmartOrderInput } from "@/lib/orders/types";
import { refreshAssignments } from "@/lib/assignments/repository";
import { refreshClients } from "@/lib/clients/repository";
import { refreshFinance } from "@/lib/finance/repository";
import { refreshPeople } from "@/lib/people/repository";
import { refreshProjects } from "@/lib/projects/repository";

function revalidateOrders() {
  revalidatePath("/orders");
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/clients");
  revalidatePath("/commercial");
}

async function refreshOrderCaches(): Promise<void> {
  await Promise.all([
    refreshClients(),
    refreshPeople(),
    refreshProjects(),
    refreshOrders(),
    refreshAssignments(),
    refreshFinance(),
  ]);
}

export async function createSmartOrderAction(
  input: SmartOrderInput
): Promise<DomainActionResult<SmartOrderResult>> {
  const gate = await requireFounder();
  if (!gate.ok) return actionError(gate.error);

  try {
    const result = await createSmartOrder(input);
    await refreshOrderCaches();
    revalidateOrders();
    return { ok: true, data: result };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function updateSmartOrderAction(
  orderId: string,
  patch: Partial<SmartOrderInput>
): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  try {
    await updateSmartOrder(orderId, patch);
    await refreshOrderCaches();
    revalidateOrders();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function applyOrderStatusAction(
  orderId: string,
  status: OrderStatus
): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  try {
    await applyOrderStatus(orderId, status);
    await refreshOrderCaches();
    revalidateOrders();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function deleteOrderAction(
  orderId: string
): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  try {
    await deleteOrder(orderId);
    await refreshOrderCaches();
    revalidateOrders();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}
