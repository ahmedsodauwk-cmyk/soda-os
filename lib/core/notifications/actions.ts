"use server";

/**
 * Human Notification decisions — Confirm / Decline crew assignments.
 * Presentation-layer bridge onto existing assignmentStatus (no new business engine).
 */

import { revalidatePath } from "next/cache";

import { updateAssignment } from "@/lib/assignments/repository";
import { refreshAssignments } from "@/lib/assignments/repository";

export type CrewDecisionResult =
  | { ok: true; status: "confirmed" | "cancelled" }
  | { ok: false; error: string };

export async function confirmCrewAssignment(
  assignmentId: string
): Promise<CrewDecisionResult> {
  const id = assignmentId?.trim();
  if (!id) return { ok: false, error: "تعيين غير موجود" };
  try {
    await refreshAssignments().catch(() => undefined);
    const updated = await updateAssignment(id, {
      assignmentStatus: "confirmed",
    });
    if (!updated) return { ok: false, error: "التعيين مش موجود" };
    revalidatePath("/notifications");
    revalidatePath("/");
    if (updated.orderId) revalidatePath(`/orders/${updated.orderId}`);
    return { ok: true, status: "confirmed" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل التأكيد",
    };
  }
}

export async function declineCrewAssignment(
  assignmentId: string
): Promise<CrewDecisionResult> {
  const id = assignmentId?.trim();
  if (!id) return { ok: false, error: "تعيين غير موجود" };
  try {
    await refreshAssignments().catch(() => undefined);
    const updated = await updateAssignment(id, {
      assignmentStatus: "cancelled",
    });
    if (!updated) return { ok: false, error: "التعيين مش موجود" };
    revalidatePath("/notifications");
    revalidatePath("/");
    if (updated.orderId) revalidatePath(`/orders/${updated.orderId}`);
    return { ok: true, status: "cancelled" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل الرفض",
    };
  }
}
