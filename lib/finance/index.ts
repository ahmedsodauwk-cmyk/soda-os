/**
 * Financial Engine — public barrel.
 */

export type {
  AllocationTargetType,
  CompanyWallet,
  Currency,
  FinanceSummary,
  FinancialAllocation,
  FinancialDirection,
  FinancialEvent,
  FinancialEventType,
  FinancialParent,
  FinancialParentType,
  Invoice,
  InvoiceStatus,
  ListFinancialEventsFilter,
  NewFinancialAllocationInput,
  NewFinancialEventInput,
} from "@/lib/finance/types";

export {
  ALLOCATION_TARGET_TYPES,
  FINANCIAL_DIRECTIONS,
  FINANCIAL_EVENT_TYPES,
  FINANCIAL_PARENT_TYPES,
  directionForEventType,
} from "@/lib/finance/types";

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
  refreshFinance,
  updateFinancialEvent,
} from "@/lib/finance/repository";

export {
  eventSignedAmount,
  getCompanyBalance,
  getCompanyWallet,
  sumAllocationsForTarget,
} from "@/lib/finance/company";

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
  FinanceValidationError,
  assertAllocationTarget,
  assertCurrency,
  assertEventType,
  assertParent,
  assertPositiveAmount,
  resolveEventDirection,
  validateNewFinancialAllocation,
  validateNewFinancialEvent,
} from "@/lib/finance/validation";

export type {
  ClientFinanceEmitContract,
  ClientFinanceQueryContract,
  CompanyFinanceQueryContract,
  CrewFinanceEmitContract,
  CrewFinanceQueryContract,
  FinanceEmitResult,
  FinanceEventDraft,
  FinanceIntegrationContracts,
  FinanceQueryScope,
  OrderFinanceEmitContract,
  OrderFinanceQueryContract,
  PaymentFinanceEmitContract,
  PaymentFinanceQueryContract,
  ProjectFinanceEmitContract,
  ProjectFinanceQueryContract,
  QuotationFinanceEmitContract,
  QuotationFinanceQueryContract,
} from "@/lib/finance/contracts/integration-contracts";

export { financialAllocations, financialEvents } from "@/lib/finance/seed";

export {
  correctFinancialEvent,
  isFinancialEventNeutralized,
  reverseFinancialEvent,
  voidFinancialEvent,
} from "@/lib/finance/safety";

export type { FinancialSafetyAction } from "@/lib/finance/safety";

export type {
  AccountView,
  CompanyCashflowSnapshot,
  OrderFinancialSnapshot,
  OrderFinancialStatus,
  TransactionCategory,
} from "@/lib/finance/core-types";

export {
  ORDER_FINANCIAL_STATUSES,
  TRANSACTION_CATEGORIES,
  isTransactionCategory,
} from "@/lib/finance/core-types";

export { getCompanyCashflow } from "@/lib/finance/cashflow";

export {
  getOrderFinancialSnapshot,
  getOrderFinancialStatus,
  listOrderFinancialSnapshots,
} from "@/lib/finance/order-status";

export {
  EXPENSE_CATEGORIES,
  createExpense,
  getExpenseById,
  listExpenses,
  refreshExpenses,
  voidExpense,
} from "@/lib/finance/expenses";

export type { CreateExpenseInput, Expense, ExpenseCategory } from "@/lib/finance/expenses";

export {
  getTransferById,
  listTransfers,
  refreshTransfers,
  transferBetweenAccounts,
  voidTransfer,
} from "@/lib/finance/transfers";

export type {
  AccountTransfer,
  CreateTransferInput,
} from "@/lib/finance/transfers";

export {
  assertPeriodOpen,
  closeMonth,
  closeYear,
  getPeriodClosing,
  isPeriodClosedForDate,
  listPeriodClosings,
  refreshPeriodClosings,
  reopenPeriod,
} from "@/lib/finance/closing";

export type {
  PeriodClosing,
  PeriodStatus,
  PeriodType,
} from "@/lib/finance/closing";
