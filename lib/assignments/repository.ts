import {
  assignmentFinalAmount,
  assignmentRemaining,
  isAssignmentPaid,
  type OrderAssignment,
} from "@/lib/assignments/types";
import { mockAssignments } from "@/lib/assignments/seed";

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

export {
  assignmentFinalAmount,
  assignmentRemaining,
  isAssignmentPaid,
};
