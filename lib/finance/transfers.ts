/**
 * Account transfers — always two movements (OUT + IN). Never net-edit balances.
 */

import { publishBusinessEvent } from "@/lib/core/publish";
import { assertPeriodOpen } from "@/lib/finance/period-guard";
import { createFinancialEvent, listFinancialEvents } from "@/lib/finance/repository";
import { reverseFinancialEvent } from "@/lib/finance/safety";
import { createDomainDb } from "@/lib/supabase/domain-db";
import {
  ensureDefaultCashAccounts,
  getCashAccountByCode,
  recordCashMovementByCode,
} from "@/lib/wallets/cash-accounts";
import type { CashAccountCode } from "@/lib/wallets/types";

export interface AccountTransfer {
  id: string;
  fromAccountId: string;
  fromAccountCode: CashAccountCode;
  toAccountId: string;
  toAccountCode: CashAccountCode;
  amount: number;
  currency: "EGP";
  notes?: string;
  financialEventId?: string;
  outflowMovementId?: string;
  inflowMovementId?: string;
  status: "posted" | "voided";
  createdBy?: string;
  occurredAt: string;
  createdAt: string;
}

type TransferRow = {
  id: string;
  from_account_id: string;
  from_account_code: string;
  to_account_id: string;
  to_account_code: string;
  amount: number | string;
  currency: string;
  notes: string | null;
  financial_event_id: string | null;
  outflow_movement_id: string | null;
  inflow_movement_id: string | null;
  status: string;
  created_by: string | null;
  occurred_at: string;
  created_at: string;
};

let transfersCache: AccountTransfer[] = [];

function rowToTransfer(row: TransferRow): AccountTransfer {
  return {
    id: row.id,
    fromAccountId: row.from_account_id,
    fromAccountCode: row.from_account_code as CashAccountCode,
    toAccountId: row.to_account_id,
    toAccountCode: row.to_account_code as CashAccountCode,
    amount: Number(row.amount) || 0,
    currency: "EGP",
    ...(row.notes ? { notes: row.notes } : {}),
    ...(row.financial_event_id
      ? { financialEventId: row.financial_event_id }
      : {}),
    ...(row.outflow_movement_id
      ? { outflowMovementId: row.outflow_movement_id }
      : {}),
    ...(row.inflow_movement_id
      ? { inflowMovementId: row.inflow_movement_id }
      : {}),
    status: row.status as AccountTransfer["status"],
    ...(row.created_by ? { createdBy: row.created_by } : {}),
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `xfer-${crypto.randomUUID()}`;
  }
  return `xfer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function refreshTransfers(): Promise<AccountTransfer[]> {
  const db = createDomainDb();
  const { data, error } = await db
    .from("account_transfers")
    .select("*")
    .order("occurred_at", { ascending: false });
  if (error) {
    console.warn(`[transfers] refresh: ${error.message}`);
    return [...transfersCache];
  }
  transfersCache = ((data ?? []) as TransferRow[]).map(rowToTransfer);
  return [...transfersCache];
}

export function listTransfers(): AccountTransfer[] {
  return [...transfersCache];
}

export function getTransferById(id: string): AccountTransfer | undefined {
  return transfersCache.find((t) => t.id === id);
}

export interface CreateTransferInput {
  fromAccountCode: CashAccountCode;
  toAccountCode: CashAccountCode;
  amount: number;
  notes?: string;
  occurredAt?: string;
  createdBy?: string;
}

export async function transferBetweenAccounts(
  input: CreateTransferInput
): Promise<AccountTransfer> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Transfer amount must be > 0");
  }
  if (input.fromAccountCode === input.toAccountCode) {
    throw new Error("Cannot transfer to the same account");
  }

  await ensureDefaultCashAccounts();
  const from = getCashAccountByCode(input.fromAccountCode);
  const to = getCashAccountByCode(input.toAccountCode);
  if (!from) throw new Error(`From account missing: ${input.fromAccountCode}`);
  if (!to) throw new Error(`To account missing: ${input.toAccountCode}`);

  const occurredAt = input.occurredAt ?? new Date().toISOString();
  assertPeriodOpen(occurredAt, "transfer");

  // Ledger: neutral pair via adjustment tagged as transfer (company parent).
  // Cash wallets move via two movements; company ledger net is unchanged.
  const event = await createFinancialEvent({
    type: "adjustment",
    amount: input.amount,
    direction: "outflow",
    occurredAt,
    createdBy: input.createdBy,
    notes:
      input.notes ??
      `Transfer ${input.fromAccountCode} → ${input.toAccountCode}`,
    parent: { parentType: "company", parentId: "soda" },
    metadata: {
      category: "transfer",
      kind: "transfer",
      fromAccountCode: input.fromAccountCode,
      toAccountCode: input.toAccountCode,
      transferNetNeutral: true,
    },
  });

  // Counter-entry so company ledger stays neutral for pure transfers
  await createFinancialEvent({
    type: "adjustment",
    amount: input.amount,
    direction: "inflow",
    occurredAt,
    createdBy: input.createdBy,
    notes: `Transfer counter-entry ${input.toAccountCode}`,
    parent: { parentType: "company", parentId: "soda" },
    metadata: {
      category: "transfer",
      kind: "transfer_counter",
      pairedEventId: event.id,
      fromAccountCode: input.fromAccountCode,
      toAccountCode: input.toAccountCode,
      transferNetNeutral: true,
    },
  });

  const outflow = await recordCashMovementByCode({
    accountCode: input.fromAccountCode,
    direction: "outflow",
    amount: input.amount,
    occurredAt,
    financialEventId: event.id,
    notes: input.notes ?? `Transfer out → ${input.toAccountCode}`,
    metadata: {
      category: "transfer",
      kind: "transfer_out",
      toAccountCode: input.toAccountCode,
    },
  });

  const inflow = await recordCashMovementByCode({
    accountCode: input.toAccountCode,
    direction: "inflow",
    amount: input.amount,
    occurredAt,
    financialEventId: event.id,
    notes: input.notes ?? `Transfer in ← ${input.fromAccountCode}`,
    metadata: {
      category: "transfer",
      kind: "transfer_in",
      fromAccountCode: input.fromAccountCode,
    },
  });

  const now = new Date().toISOString();
  const transfer: AccountTransfer = {
    id: newId(),
    fromAccountId: from.id,
    fromAccountCode: input.fromAccountCode,
    toAccountId: to.id,
    toAccountCode: input.toAccountCode,
    amount: input.amount,
    currency: "EGP",
    notes: input.notes,
    financialEventId: event.id,
    outflowMovementId: outflow.id,
    inflowMovementId: inflow.id,
    status: "posted",
    createdBy: input.createdBy,
    occurredAt,
    createdAt: now,
  };

  const db = createDomainDb();
  const { data, error } = await db
    .from("account_transfers")
    .insert({
      id: transfer.id,
      from_account_id: transfer.fromAccountId,
      from_account_code: transfer.fromAccountCode,
      to_account_id: transfer.toAccountId,
      to_account_code: transfer.toAccountCode,
      amount: transfer.amount,
      currency: transfer.currency,
      notes: transfer.notes ?? null,
      financial_event_id: transfer.financialEventId ?? null,
      outflow_movement_id: transfer.outflowMovementId ?? null,
      inflow_movement_id: transfer.inflowMovementId ?? null,
      status: transfer.status,
      created_by: transfer.createdBy ?? null,
      occurred_at: transfer.occurredAt,
      created_at: transfer.createdAt,
    })
    .select("*")
    .single();

  if (error) {
    console.warn(`[transfers] insert: ${error.message}`);
    transfersCache = [transfer, ...transfersCache];
  } else {
    const saved = rowToTransfer(data as TransferRow);
    transfersCache = [
      saved,
      ...transfersCache.filter((t) => t.id !== saved.id),
    ];
  }

  const saved =
    transfersCache.find((t) => t.id === transfer.id) ?? transfer;

  await publishBusinessEvent({
    type: "TransferCompleted",
    source: "finance.transfers.transferBetweenAccounts",
    payload: {
      entityId: saved.id,
      entityType: "system",
      summary: `Transfer ${saved.amount} EGP ${saved.fromAccountCode} → ${saved.toAccountCode}`,
      data: {
        transferId: saved.id,
        amount: saved.amount,
        from: saved.fromAccountCode,
        to: saved.toAccountCode,
        financialEventId: saved.financialEventId,
      },
    },
  });

  return { ...saved };
}

export async function voidTransfer(input: {
  transferId: string;
  reason: string;
  createdBy?: string;
}): Promise<AccountTransfer> {
  const transfer = getTransferById(input.transferId);
  if (!transfer) throw new Error(`Transfer not found: ${input.transferId}`);
  if (transfer.status === "voided") return { ...transfer };

  assertPeriodOpen(transfer.occurredAt, "void transfer");

  if (transfer.financialEventId) {
    await reverseFinancialEvent({
      eventId: transfer.financialEventId,
      reason: input.reason,
      createdBy: input.createdBy,
    });
    // Counter-entry (ledger-only) — find and reverse
    const counter = listFinancialEvents().find(
      (e) =>
        e.metadata?.kind === "transfer_counter" &&
        e.metadata?.pairedEventId === transfer.financialEventId
    );
    if (counter) {
      await reverseFinancialEvent({
        eventId: counter.id,
        reason: input.reason,
        createdBy: input.createdBy,
      });
    }
  }

  // Cash movements are mirrored by reverseFinancialEvent — do not double-post.

  const db = createDomainDb();
  const { error } = await db
    .from("account_transfers")
    .update({ status: "voided" })
    .eq("id", transfer.id);

  const updated: AccountTransfer = { ...transfer, status: "voided" };
  if (error) console.warn(`[transfers] void: ${error.message}`);
  transfersCache = transfersCache.map((t) =>
    t.id === transfer.id ? updated : t
  );
  return { ...updated };
}
