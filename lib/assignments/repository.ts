import { createAssignmentsDb } from "@/lib/assignments/db";
import {
  assignmentToRow,
  rowToAssignment,
  type AssignmentRow,
} from "@/lib/assignments/mappers";
import {
  assignmentFinalAmount,
  assignmentRemaining,
  isAssignmentPaid,
  type OrderAssignment,
} from "@/lib/assignments/types";
import { publishBusinessEvent } from "@/lib/core/publish";

export type { OrderAssignment };
export type NewAssignmentInput = Omit<
  OrderAssignment,
  "id" | "paidAmount" | "paidAt" | "createdAt" | "assignmentStatus"
> & {
  paidAmount?: number;
  paidAt?: string;
  createdAt?: string;
  id?: string;
  assignmentStatus?: OrderAssignment["assignmentStatus"];
};

let assignmentsCache: OrderAssignment[] = [];

function upsertCache(a: OrderAssignment): void {
  assignmentsCache = [a, ...assignmentsCache.filter((x) => x.id !== a.id)];
}

export async function refreshAssignments(): Promise<OrderAssignment[]> {
  const db = createAssignmentsDb();
  const { data, error } = await db
    .from("order_assignments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load assignments: ${error.message}`);
  }
  assignmentsCache = ((data ?? []) as AssignmentRow[]).map(rowToAssignment);
  return [...assignmentsCache];
}

export function getAssignments(): OrderAssignment[] {
  return [...assignmentsCache];
}

export function getAssignmentById(id: string): OrderAssignment | undefined {
  return assignmentsCache.find((a) => a.id === id);
}

export function getAssignmentsByOrder(orderId: string): OrderAssignment[] {
  return assignmentsCache.filter((a) => a.orderId === orderId);
}

export function getAssignmentsByPerson(personId: string): OrderAssignment[] {
  return assignmentsCache.filter((a) => a.personId === personId);
}

export function getActiveAssignmentsByPerson(
  personId: string,
  activeOrderIds: Set<string>
): OrderAssignment[] {
  return getAssignmentsByPerson(personId).filter((a) =>
    activeOrderIds.has(a.orderId)
  );
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `asg-${crypto.randomUUID()}`;
  }
  return `asg-${Date.now().toString(36)}`;
}

/** Create a crew assignment on an order (source of truth for crew pay). */
export async function createAssignment(
  input: NewAssignmentInput
): Promise<OrderAssignment> {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const assignment: OrderAssignment = {
    id: input.id ?? newId(),
    orderId: input.orderId,
    personId: input.personId,
    role: input.role,
    employeePrice: input.employeePrice,
    bonus: input.bonus ?? 0,
    deduction: input.deduction ?? 0,
    paidAmount: input.paidAmount ?? 0,
    paidAt: input.paidAt,
    callTime: input.callTime,
    meetingPoint: input.meetingPoint,
    assignmentStatus: input.assignmentStatus ?? "assigned",
    notes: input.notes,
    createdAt,
  };

  const db = createAssignmentsDb();
  let { data, error } = await db
    .from("order_assignments")
    .insert(assignmentToRow(assignment))
    .select("*")
    .single();

  if (
    error &&
    /column|schema cache|call_time|meeting_point|assignment_status/i.test(
      error.message
    )
  ) {
    ({ data, error } = await db
      .from("order_assignments")
      .insert({
        id: assignment.id,
        order_id: assignment.orderId,
        person_id: assignment.personId,
        role: assignment.role,
        employee_price: assignment.employeePrice,
        bonus: assignment.bonus,
        deduction: assignment.deduction,
        paid_amount: assignment.paidAmount,
        paid_at: assignment.paidAt ?? null,
        notes: [
          assignment.notes,
          assignment.callTime ? `[call] ${assignment.callTime}` : "",
          assignment.meetingPoint
            ? `[meet] ${assignment.meetingPoint}`
            : "",
          assignment.assignmentStatus !== "assigned"
            ? `[status] ${assignment.assignmentStatus}`
            : "",
        ]
          .filter(Boolean)
          .join("\n") || null,
        created_at: assignment.createdAt,
      })
      .select("*")
      .single());
  }

  if (error) {
    throw new Error(`Failed to create assignment: ${error.message}`);
  }
  const saved = rowToAssignment(data as AssignmentRow);
  // Preserve smart-ops fields in cache even if DB fell back to legacy columns
  const merged: OrderAssignment = {
    ...saved,
    callTime: assignment.callTime ?? saved.callTime,
    meetingPoint: assignment.meetingPoint ?? saved.meetingPoint,
    assignmentStatus:
      assignment.assignmentStatus ?? saved.assignmentStatus ?? "assigned",
  };
  upsertCache(merged);
  await publishBusinessEvent({
    type: "CrewAssigned",
    source: "assignments.repository.createAssignment",
    payload: {
      entityId: merged.id,
      entityType: "assignment",
      assignmentId: merged.id,
      orderId: merged.orderId,
      personId: merged.personId,
      summary: `Crew assigned to order ${merged.orderId}`,
      data: { role: merged.role, employeePrice: merged.employeePrice },
    },
  });
  return { ...merged };
}

/**
 * Update operational paidAmount on an assignment.
 * Prefer `payCrewAssignment` from lib/integration so the ledger stays in sync
 * and CrewPaid is published once (this helper does not publish).
 */
export async function updateAssignmentPayment(
  id: string,
  patch: { paidAmount: number; paidAt?: string }
): Promise<OrderAssignment | undefined> {
  const current = getAssignmentById(id);
  if (!current) return undefined;
  if (!Number.isFinite(patch.paidAmount) || patch.paidAmount < 0) {
    throw new Error("paidAmount must be a finite number ≥ 0");
  }
  const next: OrderAssignment = {
    ...current,
    paidAmount: patch.paidAmount,
    paidAt: patch.paidAt ?? current.paidAt,
  };
  const db = createAssignmentsDb();
  const { data, error } = await db
    .from("order_assignments")
    .update({
      paid_amount: next.paidAmount,
      paid_at: next.paidAt ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to update assignment payment: ${error.message}`);
  }
  const saved = rowToAssignment(data as AssignmentRow);
  upsertCache(saved);
  // CrewPaid is published only by payCrewAssignment (single path) — not here.
  return { ...saved };
}

/** Update operational assignment fields (role, pay, call time, status). */
export async function updateAssignment(
  id: string,
  patch: Partial<
    Pick<
      OrderAssignment,
      | "role"
      | "employeePrice"
      | "bonus"
      | "deduction"
      | "callTime"
      | "meetingPoint"
      | "assignmentStatus"
      | "notes"
    >
  >
): Promise<OrderAssignment | undefined> {
  const current = getAssignmentById(id);
  if (!current) return undefined;
  const next: OrderAssignment = {
    ...current,
    ...patch,
    id: current.id,
  };
  const db = createAssignmentsDb();
  const row = assignmentToRow(next);
  delete row.id;
  delete row.created_at;
  const { data, error } = await db
    .from("order_assignments")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to update assignment: ${error.message}`);
  }
  const saved = rowToAssignment(data as AssignmentRow);
  upsertCache(saved);
  return { ...saved };
}

export async function deleteAssignment(id: string): Promise<void> {
  const existing = getAssignmentById(id);
  const db = createAssignmentsDb();
  const { error } = await db.from("order_assignments").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete assignment: ${error.message}`);
  }
  assignmentsCache = assignmentsCache.filter((a) => a.id !== id);
  if (existing) {
    await publishBusinessEvent({
      type: "CrewRemoved",
      source: "assignments.repository.deleteAssignment",
      payload: {
        entityId: id,
        entityType: "assignment",
        assignmentId: id,
        orderId: existing.orderId,
        personId: existing.personId,
        summary: `Crew removed from order ${existing.orderId}`,
      },
    });
  }
}

export { assignmentFinalAmount, assignmentRemaining, isAssignmentPaid };
