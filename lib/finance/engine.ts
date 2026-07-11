/**
 * Financial Engine — composition surface.
 * Writes go through the append-only repository; reads are always calculated.
 */

export {
  createAllocation,
  createFinancialEvent,
  deleteFinancialEvent,
  getAllocatedTotalForEvent,
  getFinanceSummary,
  getFinancialEventById,
  getInvoices,
  getUnallocatedAmount,
  listAllAllocations,
  listAllocationsByEvent,
  listAllocationsByTarget,
  listFinancialEvents,
  updateFinancialEvent,
} from "@/lib/finance/repository";

export {
  calculateCashFlow,
  calculateClientOutstandingBalance,
  calculateClientPaid,
  calculateCompanyBalance,
  calculateCompanyCash,
  calculateCompanyWallet,
  calculatePersonBalance,
  calculatePersonPaid,
  calculateProjectCost,
  calculateProjectFinance,
  calculateProjectProfit,
  calculateProjectRevenue,
  listEventAllocationState,
} from "@/lib/finance/calculators";

export type {
  CashFlowFilter,
  CashFlowResult,
  ProjectFinanceResult,
} from "@/lib/finance/calculators";

export {
  eventSignedAmount,
  getCompanyBalance,
  getCompanyWallet,
  sumAllocationsForTarget,
} from "@/lib/finance/company";

export {
  FinanceValidationError,
  validateNewFinancialAllocation,
  validateNewFinancialEvent,
} from "@/lib/finance/validation";
