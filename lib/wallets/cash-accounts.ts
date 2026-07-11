/**
 * Cash accounts + movements — Supabase-backed, append-only movements.
 */

import { createDomainDb } from "@/lib/supabase/domain-db";
import {
  DEFAULT_CASH_ACCOUNTS,
  paymentMethodToAccountCode,
  type CashAccount,
  type CashAccountBalance,
  type CashAccountCode,
  type CashAccountMovement,
  type CompanyMethodWallets,
  type PaymentMethod,
} from "@/lib/wallets/types";

type CashAccountRow = {
  id: string;
  code: string;
  name: string;
  kind: string;
  currency: string;
  is_active: boolean;
  created_at: string;
};

type MovementRow = {
  id: string;
  account_id: string;
  account_code: string;
  financial_event_id: string | null;
  payment_id: string | null;
  direction: string;
  amount: number | string;
  occurred_at: string;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

let accountsCache: CashAccount[] = [];
let movementsCache: CashAccountMovement[] = [];
let seeded = false;

function rowToAccount(row: CashAccountRow): CashAccount {
  return {
    id: row.id,
    code: row.code as CashAccountCode,
    name: row.name,
    kind: row.kind as CashAccount["kind"],
    currency: "EGP",
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function rowToMovement(row: MovementRow): CashAccountMovement {
  return {
    id: row.id,
    accountId: row.account_id,
    accountCode: row.account_code as CashAccountCode,
    ...(row.financial_event_id
      ? { financialEventId: row.financial_event_id }
      : {}),
    ...(row.payment_id ? { paymentId: row.payment_id } : {}),
    direction: row.direction as "inflow" | "outflow",
    amount: Number(row.amount) || 0,
    occurredAt: row.occurred_at,
    ...(row.notes ? { notes: row.notes } : {}),
    ...(row.metadata ? { metadata: row.metadata } : {}),
    createdAt: row.created_at,
  };
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function refreshCashAccounts(): Promise<CashAccount[]> {
  const db = createDomainDb();
  const { data, error } = await db
    .from("cash_accounts")
    .select("*")
    .order("code", { ascending: true });
  if (error) {
    // Table may not exist yet — fall back to in-memory defaults
    console.warn(`[wallets] cash_accounts refresh: ${error.message}`);
    if (accountsCache.length === 0) {
      seedMemoryAccounts();
    }
    return [...accountsCache];
  }
  accountsCache = ((data ?? []) as CashAccountRow[]).map(rowToAccount);
  if (accountsCache.length === 0) {
    await ensureDefaultCashAccounts();
  }
  return [...accountsCache];
}

export async function refreshCashMovements(): Promise<CashAccountMovement[]> {
  const db = createDomainDb();
  const { data, error } = await db
    .from("cash_account_movements")
    .select("*")
    .order("occurred_at", { ascending: false });
  if (error) {
    console.warn(`[wallets] cash_account_movements refresh: ${error.message}`);
    return [...movementsCache];
  }
  movementsCache = ((data ?? []) as MovementRow[]).map(rowToMovement);
  return [...movementsCache];
}

function seedMemoryAccounts(): void {
  const now = new Date().toISOString();
  accountsCache = DEFAULT_CASH_ACCOUNTS.map((a) => ({
    ...a,
    id: `ca-${a.code}`,
    createdAt: now,
  }));
}

/** Ensure the four method wallets exist (DB or memory). */
export async function ensureDefaultCashAccounts(): Promise<CashAccount[]> {
  if (seeded && accountsCache.length >= 4) return [...accountsCache];

  const db = createDomainDb();
  const now = new Date().toISOString();

  for (const def of DEFAULT_CASH_ACCOUNTS) {
    const existing = accountsCache.find((a) => a.code === def.code);
    if (existing) continue;

    const account: CashAccount = {
      ...def,
      id: `ca-${def.code}`,
      createdAt: now,
    };

    const { data, error } = await db
      .from("cash_accounts")
      .upsert(
        {
          id: account.id,
          code: account.code,
          name: account.name,
          kind: account.kind,
          currency: account.currency,
          is_active: account.isActive,
          created_at: account.createdAt,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (error) {
      // Memory fallback when migration not applied
      if (!accountsCache.some((a) => a.code === def.code)) {
        accountsCache.push(account);
      }
      console.warn(`[wallets] ensure account ${def.code}: ${error.message}`);
      continue;
    }
    const saved = rowToAccount(data as CashAccountRow);
    accountsCache = [
      saved,
      ...accountsCache.filter((a) => a.id !== saved.id && a.code !== saved.code),
    ];
  }

  if (accountsCache.length === 0) seedMemoryAccounts();
  seeded = true;
  return [...accountsCache];
}

export function getCashAccounts(): CashAccount[] {
  if (accountsCache.length === 0) seedMemoryAccounts();
  return [...accountsCache];
}

export function getCashAccountByCode(
  code: CashAccountCode
): CashAccount | undefined {
  return getCashAccounts().find((a) => a.code === code && a.isActive);
}

export function listCashMovements(): CashAccountMovement[] {
  return [...movementsCache];
}

export function getAccountBalance(code: CashAccountCode): CashAccountBalance {
  const account =
    getCashAccountByCode(code) ??
    ({
      id: `ca-${code}`,
      code,
      name: code,
      kind: "wallet" as const,
      currency: "EGP" as const,
      isActive: true,
      createdAt: new Date().toISOString(),
    } satisfies CashAccount);

  let totalInflow = 0;
  let totalOutflow = 0;
  let movementCount = 0;
  for (const m of movementsCache) {
    if (m.accountCode !== code) continue;
    movementCount += 1;
    if (m.direction === "inflow") totalInflow += m.amount;
    else totalOutflow += m.amount;
  }

  return {
    account,
    balance: totalInflow - totalOutflow,
    totalInflow,
    totalOutflow,
    movementCount,
  };
}

export function getCompanyMethodWallets(): CompanyMethodWallets {
  const cashSafe = getAccountBalance("cash_safe").balance;
  const bank = getAccountBalance("bank").balance;
  const instapay = getAccountBalance("instapay").balance;
  const vodafoneCash = getAccountBalance("vodafone_cash").balance;
  return {
    cashSafe,
    bank,
    instapay,
    vodafoneCash,
    total: cashSafe + bank + instapay + vodafoneCash,
  };
}

export interface RecordCashMovementInput {
  method: PaymentMethod;
  direction: "inflow" | "outflow";
  amount: number;
  occurredAt?: string;
  financialEventId?: string;
  paymentId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/** Append a cash movement for a payment method (idempotent by paymentId+direction). */
export async function recordCashMovement(
  input: RecordCashMovementInput
): Promise<CashAccountMovement> {
  await ensureDefaultCashAccounts();
  const code = paymentMethodToAccountCode(input.method);
  const account = getCashAccountByCode(code);
  if (!account) {
    throw new Error(`Cash account missing for method ${input.method}`);
  }

  if (input.paymentId) {
    const existing = movementsCache.find(
      (m) =>
        m.paymentId === input.paymentId &&
        m.direction === input.direction &&
        m.accountCode === code
    );
    if (existing) return { ...existing };
  }

  const createdAt = new Date().toISOString();
  const movement: CashAccountMovement = {
    id: newId("cam"),
    accountId: account.id,
    accountCode: code,
    financialEventId: input.financialEventId,
    paymentId: input.paymentId,
    direction: input.direction,
    amount: input.amount,
    occurredAt: input.occurredAt ?? createdAt,
    notes: input.notes,
    metadata: input.metadata,
    createdAt,
  };

  const db = createDomainDb();
  const { data, error } = await db
    .from("cash_account_movements")
    .insert({
      id: movement.id,
      account_id: movement.accountId,
      account_code: movement.accountCode,
      financial_event_id: movement.financialEventId ?? null,
      payment_id: movement.paymentId ?? null,
      direction: movement.direction,
      amount: movement.amount,
      occurred_at: movement.occurredAt,
      notes: movement.notes ?? null,
      metadata: movement.metadata ?? {},
      created_at: movement.createdAt,
    })
    .select("*")
    .single();

  if (error) {
    // Memory-only when table missing — still usable for rules/tests
    console.warn(`[wallets] movement insert: ${error.message}`);
    movementsCache = [movement, ...movementsCache];
    return { ...movement };
  }

  const saved = rowToMovement(data as MovementRow);
  movementsCache = [saved, ...movementsCache.filter((m) => m.id !== saved.id)];
  return { ...saved };
}
