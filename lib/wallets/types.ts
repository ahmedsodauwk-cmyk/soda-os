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
  "bank",
  "instapay",
  "vodafone_cash",
] as const;

export type CashAccountCode = (typeof CASH_ACCOUNT_CODES)[number];

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
  bank: number;
  instapay: number;
  vodafoneCash: number;
  total: number;
}

/** Default seed accounts — idempotent upsert by code. */
export const DEFAULT_CASH_ACCOUNTS: Omit<CashAccount, "id" | "createdAt">[] = [
  {
    code: "cash_safe",
    name: "Cash Safe",
    kind: "cash",
    currency: "EGP",
    isActive: true,
  },
  {
    code: "bank",
    name: "Bank",
    kind: "bank",
    currency: "EGP",
    isActive: true,
  },
  {
    code: "instapay",
    name: "Instapay Wallet",
    kind: "wallet",
    currency: "EGP",
    isActive: true,
  },
  {
    code: "vodafone_cash",
    name: "Vodafone Cash Wallet",
    kind: "wallet",
    currency: "EGP",
    isActive: true,
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
  bank: number;
  instapay: number;
  vodafoneCash: number;
  companyBalance: number;
  pendingCrewPayments: number;
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
