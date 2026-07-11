import type {
  FinancialAllocation,
  FinancialEvent,
} from "@/lib/finance/types";

/** Legacy empty — source of truth is Supabase financial_* tables. */
export const financialEvents: FinancialEvent[] = [];
export const financialAllocations: FinancialAllocation[] = [];
