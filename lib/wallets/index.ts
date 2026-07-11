/**
 * Wallets — company cash accounts + crew wallet.
 */

export type {
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
  CASH_ACCOUNT_CODES,
  DEFAULT_CASH_ACCOUNTS,
  PAYMENT_METHODS,
  isPaymentMethod,
  paymentMethodToAccountCode,
} from "@/lib/wallets/types";

export {
  ensureDefaultCashAccounts,
  getAccountBalance,
  getCashAccountByCode,
  getCashAccounts,
  getCompanyMethodWallets,
  listCashMovements,
  recordCashMovement,
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
