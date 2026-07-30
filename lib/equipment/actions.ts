"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  sanitizeActionError,
  type DomainActionResult,
} from "@/lib/domain/types";
import { requireFounderMutationAccess, requirePermission } from "@/lib/domain/mutation-auth";
import {
  assignEquipmentToPerson,
  createEquipment,
  deleteEquipment,
  refreshEquipment,
  updateEquipment,
} from "@/lib/equipment/repository";
import type {
  EquipmentItem,
  EquipmentStatus,
} from "@/lib/equipment/types";
import type { NewEquipmentInput } from "@/lib/equipment/repository";

function revalidateEquipment() {
  revalidatePath("/equipment");
  revalidatePath("/people");
  revalidatePath("/crew");
}

export async function createEquipmentAction(
  input: NewEquipmentInput
): Promise<DomainActionResult<EquipmentItem>> {
  const gate = await requirePermission("equipment.edit");
  if (!gate.ok) return actionError(gate.error);

  try {
    const item = await createEquipment(input);
    await refreshEquipment();
    revalidateEquipment();
    return { ok: true, data: item };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function updateEquipmentAction(
  id: string,
  patch: Partial<NewEquipmentInput> & { status?: EquipmentStatus }
): Promise<DomainActionResult<EquipmentItem>> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  try {
    const item = await updateEquipment(id, patch);
    await refreshEquipment();
    revalidateEquipment();
    return { ok: true, data: item };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function deleteEquipmentAction(
  id: string
): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  try {
    await deleteEquipment(id);
    await refreshEquipment();
    revalidateEquipment();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function assignEquipmentToPersonAction(
  equipmentId: string,
  personId: string
): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  try {
    await assignEquipmentToPerson(equipmentId, personId);
    await refreshEquipment();
    revalidateEquipment();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}
