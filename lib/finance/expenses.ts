/**
 * Expenses module — category / vendor / amount / account / receipt.
 * Always posts financial_event (expense) + cash outflow. Never mutates balances directly.
 */

import { publishBusinessEvent } from "@/lib/core/publish";
import { assertPeriodOpen } from "@/lib/finance/period-guard";
import { createFinancialEvent } from "@/lib/finance/repository";
import { reverseFinancialEvent } from "@/lib/finance/safety";
import { createDomainDb } from "@/lib/supabase/domain-db";
import {
  ensureDefaultCashAccounts,
  getCashAccountByCode,
  recordCashMovementByCode,
} from "@/lib/wallets/cash-accounts";
import type { CashAccountCode } from "@/lib/wallets/types";

export const EXPENSE_CATEGORIES = [
  "operations",
  "equipment",
  "supplier",
  "transport",
  "marketing",
  "rent",
  "utilities",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Post-shoot expense report line kinds (stored as expense.category). */
export const ORDER_EXPENSE_REPORT_KINDS = [
  "transportation",
  "rental",
  "freelancer",
  "parking",
  "food",
  "misc",
] as const;

export type OrderExpenseReportKind = (typeof ORDER_EXPENSE_REPORT_KINDS)[number];

export interface Expense {
  id: string;
  category: string;
  vendor?: string;
  amount: number;
  currency: "EGP";
  accountCode: CashAccountCode;
  accountId?: string;
  receiptUrl?: string;
  expenseDate: string;
  notes?: string;
  /** Linked order for post-shoot / planned expense reports */
  orderId?: string;
  financialEventId?: string;
  cashMovementId?: string;
  status: "posted" | "voided";
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

type ExpenseRow = {
  id: string;
  category: string;
  vendor: string | null;
  amount: number | string;
  currency: string;
  account_code: string;
  account_id: string | null;
  receipt_url: string | null;
  expense_date: string;
  notes: string | null;
  order_id?: string | null;
  financial_event_id: string | null;
  cash_movement_id: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

let expensesCache: Expense[] = [];

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    category: row.category,
    ...(row.vendor ? { vendor: row.vendor } : {}),
    amount: Number(row.amount) || 0,
    currency: "EGP",
    accountCode: row.account_code as CashAccountCode,
    ...(row.account_id ? { accountId: row.account_id } : {}),
    ...(row.receipt_url ? { receiptUrl: row.receipt_url } : {}),
    expenseDate: row.expense_date,
    ...(row.notes ? { notes: row.notes } : {}),
    ...(row.order_id ? { orderId: row.order_id } : {}),
    ...(row.financial_event_id
      ? { financialEventId: row.financial_event_id }
      : {}),
    ...(row.cash_movement_id ? { cashMovementId: row.cash_movement_id } : {}),
    status: row.status as Expense["status"],
    ...(row.created_by ? { createdBy: row.created_by } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `exp-${crypto.randomUUID()}`;
  }
  return `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function refreshExpenses(): Promise<Expense[]> {
  const db = createDomainDb();
  const { data, error } = await db
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false });
  if (error) {
    console.warn(`[expenses] refresh: ${error.message}`);
    return [...expensesCache];
  }
  expensesCache = ((data ?? []) as ExpenseRow[]).map(rowToExpense);
  return [...expensesCache];
}

export function listExpenses(): Expense[] {
  return [...expensesCache];
}

export function listExpensesByOrder(orderId: string): Expense[] {
  return expensesCache.filter(
    (e) => e.orderId === orderId && e.status === "posted"
  );
}

export function getExpenseById(id: string): Expense | undefined {
  return expensesCache.find((e) => e.id === id);
}

export interface CreateExpenseInput {
  category: string;
  vendor?: string;
  amount: number;
  accountCode?: CashAccountCode;
  receiptUrl?: string;
  expenseDate?: string;
  notes?: string;
  createdBy?: string;
  orderId?: string;
}

export async function createExpense(
  input: CreateExpenseInput
): Promise<Expense> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Expense amount must be > 0");
  }

  await ensureDefaultCashAccounts();
  const accountCode = input.accountCode ?? "cash_safe";
  const account = getCashAccountByCode(accountCode);
  if (!account) throw new Error(`Account missing: ${accountCode}`);

  const expenseDate =
    input.expenseDate ?? new Date().toISOString().slice(0, 10);
  assertPeriodOpen(expenseDate, "post expense");

  const categoryMeta =
    input.category === "equipment"
      ? "equipment_purchase"
      : input.category === "supplier"
        ? "supplier_payment"
        : "expense";

  const event = await createFinancialEvent({
    type: "expense",
    amount: input.amount,
    direction: "outflow",
    occurredAt: `${expenseDate}T12:00:00.000Z`,
    createdBy: input.createdBy,
    notes: input.notes ?? `Expense: ${input.category}`,
    parent: input.orderId
      ? { parentType: "order", parentId: input.orderId }
      : { parentType: "company", parentId: "soda" },
    metadata: {
      category: categoryMeta,
      expenseCategory: input.category,
      vendor: input.vendor,
      accountCode,
      receiptUrl: input.receiptUrl,
      kind: "expense",
      orderId: input.orderId,
    },
  });

  const movement = await recordCashMovementByCode({
    accountCode,
    direction: "outflow",
    amount: input.amount,
    occurredAt: `${expenseDate}T12:00:00.000Z`,
    financialEventId: event.id,
    notes: input.notes ?? `Expense: ${input.category}`,
    metadata: {
      category: categoryMeta,
      expenseCategory: input.category,
      vendor: input.vendor,
      kind: "expense",
      orderId: input.orderId,
    },
  });

  const now = new Date().toISOString();
  const expense: Expense = {
    id: newId(),
    category: input.category,
    vendor: input.vendor,
    amount: input.amount,
    currency: "EGP",
    accountCode,
    accountId: account.id,
    receiptUrl: input.receiptUrl,
    expenseDate,
    notes: input.notes,
    orderId: input.orderId,
    financialEventId: event.id,
    cashMovementId: movement.id,
    status: "posted",
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const db = createDomainDb();
  const { data, error } = await db
    .from("expenses")
    .insert({
      id: expense.id,
      category: expense.category,
      vendor: expense.vendor ?? null,
      amount: expense.amount,
      currency: expense.currency,
      account_code: expense.accountCode,
      account_id: expense.accountId ?? null,
      receipt_url: expense.receiptUrl ?? null,
      expense_date: expense.expenseDate,
      notes: expense.notes ?? null,
      order_id: expense.orderId ?? null,
      financial_event_id: expense.financialEventId ?? null,
      cash_movement_id: expense.cashMovementId ?? null,
      status: expense.status,
      created_by: expense.createdBy ?? null,
      created_at: expense.createdAt,
      updated_at: expense.updatedAt,
    })
    .select("*")
    .single();

  if (error) {
    console.warn(`[expenses] insert: ${error.message}`);
    expensesCache = [expense, ...expensesCache];
  } else {
    const saved = rowToExpense(data as ExpenseRow);
    expensesCache = [saved, ...expensesCache.filter((e) => e.id !== saved.id)];
  }

  const saved =
    expensesCache.find((e) => e.id === expense.id) ?? expense;

  await publishBusinessEvent({
    type: "ExpenseRecorded",
    source: "finance.expenses.createExpense",
    payload: {
      entityId: saved.id,
      entityType: "system",
      summary: `Expense ${saved.amount} EGP (${saved.category})`,
      data: {
        expenseId: saved.id,
        amount: saved.amount,
        category: saved.category,
        accountCode: saved.accountCode,
        financialEventId: saved.financialEventId,
      },
    },
  });

  return { ...saved };
}

/** Void expense via financial reversal — never deletes. */
export async function voidExpense(input: {
  expenseId: string;
  reason: string;
  createdBy?: string;
}): Promise<Expense> {
  const expense = getExpenseById(input.expenseId);
  if (!expense) throw new Error(`Expense not found: ${input.expenseId}`);
  if (expense.status === "voided") return { ...expense };

  assertPeriodOpen(expense.expenseDate, "void expense");

  if (expense.financialEventId) {
    await reverseFinancialEvent({
      eventId: expense.financialEventId,
      reason: input.reason,
      createdBy: input.createdBy,
    });
  }

  const now = new Date().toISOString();
  const updated: Expense = {
    ...expense,
    status: "voided",
    updatedAt: now,
  };

  const db = createDomainDb();
  const { error } = await db
    .from("expenses")
    .update({ status: "voided", updated_at: now })
    .eq("id", expense.id);

  if (error) {
    console.warn(`[expenses] void: ${error.message}`);
  }
  expensesCache = expensesCache.map((e) =>
    e.id === expense.id ? updated : e
  );

  return { ...updated };
}
