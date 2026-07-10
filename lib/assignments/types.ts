/**
 * Order → Person assignments drive all people payments.
 * finalAmount = employeePrice + bonus - deduction
 */

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
