import {
  assignmentFinalAmount,
  assignmentRemaining,
  isAssignmentPaid,
  type OrderAssignment,
} from "@/lib/assignments/types";
import { mockAssignments } from "@/lib/assignments/seed";

export type NewAssignmentInput = Omit<
  OrderAssignment,
  "id" | "paidAmount" | "paidAt" | "createdAt"
> & {
  paidAmount?: number;
  paidAt?: string;
  createdAt?: string;
};

export function getAssignments(): OrderAssignment[] {
  return [...mockAssignments];
}

export function getAssignmentById(id: string): OrderAssignment | undefined {
  return mockAssignments.find((a) => a.id === id);
}

export function getAssignmentsByOrder(orderId: string): OrderAssignment[] {
  return mockAssignments.filter((a) => a.orderId === orderId);
}

export function getAssignmentsByPerson(personId: string): OrderAssignment[] {
  return mockAssignments.filter((a) => a.personId === personId);
}

export function getActiveAssignmentsByPerson(
  personId: string,
  activeOrderIds: Set<string>
): OrderAssignment[] {
  return getAssignmentsByPerson(personId).filter((a) =>
    activeOrderIds.has(a.orderId)
  );
}

/** Create a crew assignment on an order (source of truth for crew pay). */
export function createAssignment(input: NewAssignmentInput): OrderAssignment {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const assignment: OrderAssignment = {
    id: `asg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    orderId: input.orderId,
    personId: input.personId,
    role: input.role,
    employeePrice: input.employeePrice,
    bonus: input.bonus ?? 0,
    deduction: input.deduction ?? 0,
    paidAmount: input.paidAmount ?? 0,
    paidAt: input.paidAt,
    notes: input.notes,
    createdAt,
  };
  mockAssignments.unshift(assignment);
  return { ...assignment };
}

/**
 * Update operational paidAmount on an assignment.
 * Prefer `payCrewAssignment` from lib/integration so the ledger stays in sync.
 */
export function updateAssignmentPayment(
  id: string,
  patch: { paidAmount: number; paidAt?: string }
): OrderAssignment | undefined {
  const idx = mockAssignments.findIndex((a) => a.id === id);
  if (idx < 0) return undefined;
  if (!Number.isFinite(patch.paidAmount) || patch.paidAmount < 0) {
    throw new Error("paidAmount must be a finite number ≥ 0");
  }
  const current = mockAssignments[idx];
  const next: OrderAssignment = {
    ...current,
    paidAmount: patch.paidAmount,
    paidAt: patch.paidAt ?? current.paidAt,
  };
  mockAssignments[idx] = next;
  return { ...next };
}

export {
  assignmentFinalAmount,
  assignmentRemaining,
  isAssignmentPaid,
};
export type { OrderAssignment };
