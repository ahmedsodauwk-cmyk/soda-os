import type { FinancialAllocation, FinancialEvent } from "@/lib/finance/types";

/**
 * In-memory Financial Engine stores — empty until create flows append.
 * No fake business data.
 */
export const financialEvents: FinancialEvent[] = [];

export const financialAllocations: FinancialAllocation[] = [];
