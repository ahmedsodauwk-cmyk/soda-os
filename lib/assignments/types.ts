/**
 * Order → Person assignments drive all people payments.
 * finalAmount = employeePrice + bonus - deduction
 */

export const ASSIGNMENT_STATUSES = [
  "assigned",
  "confirmed",
  "checked_in",
  "completed",
  "no_show",
  "cancelled",
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export interface OrderAssignment {
  id: string;
  orderId: string;
  personId: string;
  role: string;
  /** Agreed crew rate for this order */
  employeePrice: number;
  bonus: number;
  deduction: number;
  /** Amount already paid against this assignment */
  paidAmount: number;
  /** When the crew payment was last updated */
  paidAt?: string;
  /** Call / arrival time (HH:mm or free text) */
  callTime?: string;
  /** Meeting / rally point */
  meetingPoint?: string;
  /** Operational status for this assignment */
  assignmentStatus: AssignmentStatus;
  notes?: string;
  createdAt: string;
}

export function assignmentFinalAmount(a: Pick<
  OrderAssignment,
  "employeePrice" | "bonus" | "deduction"
>): number {
  return Math.max(0, a.employeePrice + a.bonus - a.deduction);
}

export function assignmentRemaining(a: OrderAssignment): number {
  return Math.max(0, assignmentFinalAmount(a) - a.paidAmount);
}

export function isAssignmentPaid(a: OrderAssignment): boolean {
  return assignmentRemaining(a) <= 0 && assignmentFinalAmount(a) > 0;
}
