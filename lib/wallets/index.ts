/**
 * Wallets — company cash accounts + crew wallet.
 */

export type {
  AccountStatus,
  AccountType,
  CashAccount,
  CashAccountBalance,
  CashAccountCode,
  CashAccountMovement,
  ClientProfileStats,
  CompanyMethodWallets,
  CrewEarning,
  CrewEarningStatus,
  CrewWalletSnapshot,
  FinancialReportSnapshot,
  PaymentMethod,
} from "@/lib/wallets/types";

export {
  ACCOUNT_TYPES,
  CASH_ACCOUNT_CODES,
  DEFAULT_CASH_ACCOUNTS,
  PAYMENT_METHODS,
  isCashAccountCode,
  isPaymentMethod,
  paymentMethodToAccountCode,
} from "@/lib/wallets/types";

export {
  createBankAccount,
  ensureDefaultCashAccounts,
  getAccountBalance,
  getCashAccountByCode,
  getCashAccounts,
  getCompanyMethodWallets,
  listAccountViews,
  listCashMovements,
  recordCashMovement,
  recordCashMovementByCode,
  refreshCashAccounts,
  refreshCashMovements,
} from "@/lib/wallets/cash-accounts";

export {
  ensureMonthlyTargetBonus,
  getCrewWallet,
  getTotalPendingCrewPayments,
  listCrewEarnings,
  markCrewEarningPaid,
  refreshCrewEarnings,
  syncPendingEarningsForOrder,
} from "@/lib/wallets/crew-wallet";
