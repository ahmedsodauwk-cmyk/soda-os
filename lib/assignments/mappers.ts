import type { OrderAssignment } from "@/lib/assignments/types";

export type AssignmentRow = {
  id: string;
  order_id: string;
  person_id: string;
  role: string;
  employee_price: number | string;
  bonus: number | string;
  deduction: number | string;
  paid_amount: number | string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
};

export function rowToAssignment(row: AssignmentRow): OrderAssignment {
  return {
    id: row.id,
    orderId: row.order_id,
    personId: row.person_id,
    role: row.role ?? "",
    employeePrice: Number(row.employee_price) || 0,
    bonus: Number(row.bonus) || 0,
    deduction: Number(row.deduction) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    ...(row.paid_at ? { paidAt: row.paid_at } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    createdAt: row.created_at,
  };
}

export function assignmentToRow(a: OrderAssignment): Record<string, unknown> {
  return {
    id: a.id,
    order_id: a.orderId,
    person_id: a.personId,
    role: a.role,
    employee_price: a.employeePrice,
    bonus: a.bonus,
    deduction: a.deduction,
    paid_amount: a.paidAmount,
    paid_at: a.paidAt ?? null,
    notes: a.notes ?? null,
    created_at: a.createdAt,
  };
}
