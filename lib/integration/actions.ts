"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  sanitizeActionError,
  type DomainActionResult,
} from "@/lib/domain/types";
import {
  isClientIdInScope,
  requireFounder,
  requireFounderMutationAccess,
} from "@/lib/domain/mutation-auth";
import {
  advanceProjectJourney,
  assignCrewToOrder,
  emitOrderClientPayment,
  finishProject,
  markShootComplete,
  runQuotationConversionFlow,
  type QuotationConversionFlowResult,
} from "@/lib/integration/flows";
import type { NewAssignmentInput } from "@/lib/assignments/repository";
import { fetchProjectById, refreshProjects } from "@/lib/projects/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshAssignments } from "@/lib/assignments/repository";
import { refreshFinance } from "@/lib/finance/repository";
import { getQuotationById } from "@/lib/quotations/repository";

function revalidateIntegrationPaths() {
  revalidatePath("/orders");
  revalidatePath("/projects");
  revalidatePath("/quotations");
  revalidatePath("/finance");
  revalidatePath("/");
}

export async function assignCrewToOrderAction(
  input: NewAssignmentInput
): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  try {
    await assignCrewToOrder(input);
    await Promise.all([
      refreshOrders(),
      refreshAssignments(),
      refreshProjects(),
    ]);
    revalidateIntegrationPaths();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function emitOrderClientPaymentAction(input: {
  orderId: string;
  amount: number;
  paymentId?: string;
  notes?: string;
}): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return actionError("Invalid payment amount.");
  }

  try {
    await emitOrderClientPayment(input);
    await Promise.all([refreshOrders(), refreshFinance()]);
    revalidateIntegrationPaths();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function markShootCompleteAction(
  orderId: string
): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  try {
    await markShootComplete(orderId);
    await Promise.all([refreshOrders(), refreshProjects()]);
    revalidateIntegrationPaths();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function finishProjectAction(
  projectId: string
): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  const project = await fetchProjectById(projectId);
  if (!project) return actionError("Project not found.");
  if (!isClientIdInScope(project.clientId, gate.scope)) {
    return actionError("Project not in scope.");
  }

  try {
    await finishProject(projectId);
    await refreshProjects();
    revalidateIntegrationPaths();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function advanceProjectJourneyAction(
  projectId: string,
  stage: Parameters<typeof advanceProjectJourney>[1]
): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  const project = await fetchProjectById(projectId);
  if (!project) return actionError("Project not found.");
  if (!isClientIdInScope(project.clientId, gate.scope)) {
    return actionError("Project not in scope.");
  }

  try {
    await advanceProjectJourney(projectId, stage);
    await refreshProjects();
    revalidateIntegrationPaths();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function runQuotationConversionFlowAction(
  quotationId: string,
  options?: { editedBy?: string; force?: boolean; emitDeposit?: boolean }
): Promise<DomainActionResult<QuotationConversionFlowResult>> {
  const gate = await requireFounder();
  if (!gate.ok) return actionError(gate.error);

  const quotation = getQuotationById(quotationId);
  if (!quotation) return actionError("Quotation not found.");
  if (
    quotation.clientId &&
    !isClientIdInScope(quotation.clientId, gate.scope)
  ) {
    return actionError("Quotation not in scope.");
  }

  try {
    const result = await runQuotationConversionFlow(quotationId, options);
    await Promise.all([refreshOrders(), refreshProjects()]);
    revalidateIntegrationPaths();
    return { ok: true, data: result };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}
