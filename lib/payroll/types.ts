/**
 * Payroll foundation — types only (module not built this sprint).
 */
export type PayrollPeriodStatus = "draft" | "open" | "closed" | "paid";

export interface PayrollPeriod {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
  status: PayrollPeriodStatus;
}

export interface PayrollEntry {
  id: string;
  periodId: string;
  teamMemberId: string;
  teamMemberName: string;
  role?: string;
  amount: number;
  currency: "EGP";
  projectId?: string;
  orderId?: string;
  note?: string;
}
