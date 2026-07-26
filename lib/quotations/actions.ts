"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  sanitizeActionError,
  type DomainActionResult,
} from "@/lib/domain/types";
import {
  isClientIdInScope,
  requirePermission,
} from "@/lib/domain/mutation-auth";
import {
  createQuotation,
  deleteQuotation,
  getQuotationById,
  markDepositReceived,
  moveQuotationStage,
  refreshQuotations,
  restoreQuotationVersion,
  setQuotationApprovalStatus,
  updateQuotation,
} from "@/lib/quotations/repository";
import type {
  ApprovalStatus,
  NewQuotationInput,
  PipelineStage,
  Quotation,
} from "@/lib/quotations/types";

function revalidateQuotations(quotationId?: string) {
  revalidatePath("/quotations");
  revalidatePath("/commercial");
  if (quotationId) {
    revalidatePath(`/quotations/${quotationId}`);
    revalidatePath(`/quotations/${quotationId}`, "layout");
  }
}

async function assertQuotationAccess(
  quotationId: string,
  permission: "quotations.edit" | "quotations.view"
): Promise<
  | { ok: true; quotation: Quotation }
  | { ok: false; error: string }
> {
  const gate = await requirePermission(permission);
  if (!gate.ok) return gate;

  const quotation = getQuotationById(quotationId);
  if (!quotation) return { ok: false, error: "Quotation not found." };

  if (
    quotation.clientId &&
    !isClientIdInScope(quotation.clientId, gate.scope)
  ) {
    return { ok: false, error: "Quotation not in scope." };
  }
  return { ok: true, quotation };
}

export async function createQuotationAction(
  input: NewQuotationInput
): Promise<DomainActionResult<Quotation>> {
  const gate = await requirePermission("quotations.edit");
  if (!gate.ok) return actionError(gate.error);
  if (input.clientId && !isClientIdInScope(input.clientId, gate.scope)) {
    return actionError("Client not in scope.");
  }

  try {
    const quotation = await createQuotation(input);
    await refreshQuotations();
    revalidateQuotations(quotation.id);
    return { ok: true, data: quotation };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function updateQuotationAction(
  quotationId: string,
  patch: Parameters<typeof updateQuotation>[1],
  meta?: Parameters<typeof updateQuotation>[2]
): Promise<DomainActionResult<Quotation | null>> {
  const access = await assertQuotationAccess(quotationId, "quotations.edit");
  if (!access.ok) return actionError(access.error);

  try {
    const updated = await updateQuotation(quotationId, patch, meta);
    await refreshQuotations();
    revalidateQuotations(quotationId);
    return { ok: true, data: updated };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function deleteQuotationAction(
  quotationId: string
): Promise<DomainActionResult> {
  const access = await assertQuotationAccess(quotationId, "quotations.edit");
  if (!access.ok) return actionError(access.error);

  try {
    await deleteQuotation(quotationId);
    await refreshQuotations();
    revalidateQuotations();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function moveQuotationStageAction(
  quotationId: string,
  stage: PipelineStage
): Promise<DomainActionResult<Quotation | null>> {
  const access = await assertQuotationAccess(quotationId, "quotations.edit");
  if (!access.ok) return actionError(access.error);

  try {
    const updated = await moveQuotationStage(quotationId, stage);
    await refreshQuotations();
    revalidateQuotations(quotationId);
    return { ok: true, data: updated };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function setQuotationApprovalStatusAction(
  quotationId: string,
  status: ApprovalStatus,
  editedBy?: string
): Promise<DomainActionResult<Quotation | null>> {
  const access = await assertQuotationAccess(quotationId, "quotations.edit");
  if (!access.ok) return actionError(access.error);

  try {
    const updated = await setQuotationApprovalStatus(
      quotationId,
      status,
      editedBy
    );
    await refreshQuotations();
    revalidateQuotations(quotationId);
    return { ok: true, data: updated };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function markDepositReceivedAction(
  quotationId: string,
  editedBy?: string
): Promise<DomainActionResult<Quotation | null>> {
  const access = await assertQuotationAccess(quotationId, "quotations.edit");
  if (!access.ok) return actionError(access.error);

  try {
    const updated = await markDepositReceived(quotationId, editedBy);
    await refreshQuotations();
    revalidateQuotations(quotationId);
    return { ok: true, data: updated };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function restoreQuotationVersionAction(
  quotationId: string,
  versionNumber: number,
  editedBy?: string
): Promise<DomainActionResult<Quotation | null>> {
  const access = await assertQuotationAccess(quotationId, "quotations.edit");
  if (!access.ok) return actionError(access.error);

  try {
    const restored = await restoreQuotationVersion(
      quotationId,
      versionNumber,
      editedBy
    );
    await refreshQuotations();
    revalidateQuotations(quotationId);
    return { ok: true, data: restored };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}
