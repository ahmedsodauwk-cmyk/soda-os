/**
 * Payroll repository stub — empty until Payroll module ships.
 */
import type { PayrollEntry, PayrollPeriod } from "@/lib/payroll/types";

export function getPayrollPeriods(): PayrollPeriod[] {
  return [];
}

export function getPayrollEntries(periodId?: string): PayrollEntry[] {
  void periodId;
  return [];
}
