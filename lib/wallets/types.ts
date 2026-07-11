/**
 * Cash / bank / wallet accounts — company money by payment method.
 * Balances are derived from append-only movements (never stored as mutable cash).
 */

export const PAYMENT_METHODS = [
  "cash",
  "bank",
  "instapay",
  "vodafone_cash",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CASH_ACCOUNT_CODES = [
  "cash_safe",
  "secondary_cash_safe",
  "bank",
  "instapay",
  "vodafone_cash",
] as const;

/** Known defaults plus future/custom bank codes (e.g. bank_cib). */
export type CashAccountCode =
  | (typeof CASH_ACCOUNT_CODES)[number]
  | (string & {});

export const ACCOUNT_TYPES = [
  "main_cash_safe",
  "secondary_cash_safe",
  "bank",
  "instapay",
  "vodafone_cash",
  "wallet",
  "other",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export type AccountStatus = "active" | "inactive" | "frozen";

export function paymentMethodToAccountCode(
  method: PaymentMethod
): CashAccountCode {
  switch (method) {
    case "cash":
      return "cash_safe";
    case "bank":
      return "bank";
    case "instapay":
      return "instapay";
    case "vodafone_cash":
      return "vodafone_cash";
  }
}

export function isCashAccountCode(value: unknown): value is CashAccountCode {
  return (
    typeof value === "string" &&
    (CASH_ACCOUNT_CODES as readonly string[]).includes(value)
  );
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    (PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

export interface CashAccount {
  id: string;
  code: CashAccountCode;
  name: string;
  kind: "cash" | "bank" | "wallet";
  currency: "EGP";
  isActive: boolean;
  accountType: AccountType;
  openingBalance: number;
  status: AccountStatus;
  createdAt: string;
}

export interface CashAccountMovement {
  id: string;
  accountId: string;
  accountCode: CashAccountCode;
  financialEventId?: string;
  paymentId?: string;
  direction: "inflow" | "outflow";
  amount: number;
  occurredAt: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CashAccountBalance {
  account: CashAccount;
  balance: number;
  totalInflow: number;
  totalOutflow: number;
  movementCount: number;
}

export interface CompanyMethodWallets {
  cashSafe: number;
  secondaryCashSafe: number;
  bank: number;
  instapay: number;
  vodafoneCash: number;
  total: number;
}

/** Default seed accounts — idempotent upsert by code. */
export const DEFAULT_CASH_ACCOUNTS: Omit<CashAccount, "id" | "createdAt">[] = [
  {
    code: "cash_safe",
    name: "Main Cash Safe",
    kind: "cash",
    currency: "EGP",
    isActive: true,
    accountType: "main_cash_safe",
    openingBalance: 0,
    status: "active",
  },
  {
    code: "secondary_cash_safe",
    name: "Secondary Cash Safe",
    kind: "cash",
    currency: "EGP",
    isActive: true,
    accountType: "secondary_cash_safe",
    openingBalance: 0,
    status: "active",
  },
  {
    code: "bank",
    name: "Bank",
    kind: "bank",
    currency: "EGP",
    isActive: true,
    accountType: "bank",
    openingBalance: 0,
    status: "active",
  },
  {
    code: "instapay",
    name: "Instapay Wallet",
    kind: "wallet",
    currency: "EGP",
    isActive: true,
    accountType: "instapay",
    openingBalance: 0,
    status: "active",
  },
  {
    code: "vodafone_cash",
    name: "Vodafone Cash Wallet",
    kind: "wallet",
    currency: "EGP",
    isActive: true,
    accountType: "vodafone_cash",
    openingBalance: 0,
    status: "active",
  },
];

export type CrewEarningStatus = "pending" | "paid" | "voided" | "cancelled";

export interface CrewEarning {
  id: string;
  personId: string;
  assignmentId?: string;
  orderId?: string;
  clientId?: string;
  projectId?: string;
  clientName?: string;
  projectName?: string;
  shootDate?: string;
  role: string;
  amount: number;
  status: CrewEarningStatus;
  paidAt?: string;
  financialEventId?: string;
  /** null = regular assignment earning; monthly_target = auto bonus */
  bonusKind?: "monthly_target" | null;
  monthKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrewWalletSnapshot {
  personId: string;
  pendingTotal: number;
  paidTotal: number;
  earnings: CrewEarning[];
  monthlyCompletedOrders: number;
  yearlyCompletedOrders: number;
  bonusProgress: number;
  bonusQualified: boolean;
  bonusEgp: number;
  monthKey: string;
}

export interface FinancialReportSnapshot {
  asOf: string;
  monthKey: string;
  yearKey: string;
  monthlyRevenue: number;
  yearlyRevenue: number;
  outstanding: number;
  collected: number;
  cashSafe: number;
  secondaryCashSafe: number;
  bank: number;
  instapay: number;
  vodafoneCash: number;
  companyBalance: number;
  pendingCrewPayments: number;
  incomeToday: number;
  expenseToday: number;
  incomeMonth: number;
  expenseMonth: number;
  netProfitMonth: number;
  incomeYear: number;
  expenseYear: number;
  netProfitYear: number;
}

export interface ClientProfileStats {
  clientId: string;
  totalOrders: number;
  monthlyOrders: number;
  yearlyOrders: number;
  revenue: number;
  outstanding: number;
  collected: number;
  lastShoot: string | null;
  nextShoot: string | null;
  lifetimeValue: number;
}
