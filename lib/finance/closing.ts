/**
 * Period closing — monthly / yearly freeze + snapshot.
 * Closed periods reject new financial mutations (except admin reopen).
 */

import { publishBusinessEvent } from "@/lib/core/publish";
import { createDomainDb } from "@/lib/supabase/domain-db";
import { getCompanyCashflow } from "@/lib/finance/cashflow";
import { syncClosedPeriods } from "@/lib/finance/period-guard";
import {
  getCompanyMethodWallets,
  listCashMovements,
} from "@/lib/wallets/cash-accounts";
import { getCompanyWallet } from "@/lib/finance/company";
import { listFinancialEvents } from "@/lib/finance/repository";
import { getTotalPendingCrewPayments } from "@/lib/wallets/crew-wallet";

export type PeriodType = "month" | "year";
export type PeriodStatus = "closed" | "reopened";

export interface PeriodClosing {
  id: string;
  periodType: PeriodType;
  periodKey: string;
  status: PeriodStatus;
  snapshot: Record<string, unknown>;
  closedAt: string;
  closedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
  createdAt: string;
}

type PeriodRow = {
  id: string;
  period_type: string;
  period_key: string;
  status: string;
  snapshot: Record<string, unknown> | null;
  closed_at: string;
  closed_by: string | null;
  reopened_at: string | null;
  reopened_by: string | null;
  reopen_reason: string | null;
  created_at: string;
};

let closingsCache: PeriodClosing[] = [];

function rowToClosing(row: PeriodRow): PeriodClosing {
  return {
    id: row.id,
    periodType: row.period_type as PeriodType,
    periodKey: row.period_key,
    status: row.status as PeriodStatus,
    snapshot: row.snapshot ?? {},
    closedAt: row.closed_at,
    ...(row.closed_by ? { closedBy: row.closed_by } : {}),
    ...(row.reopened_at ? { reopenedAt: row.reopened_at } : {}),
    ...(row.reopened_by ? { reopenedBy: row.reopened_by } : {}),
    ...(row.reopen_reason ? { reopenReason: row.reopen_reason } : {}),
    createdAt: row.created_at,
  };
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function rebuildGuard(): void {
  syncClosedPeriods(
    closingsCache.map((c) => ({
      periodType: c.periodType,
      periodKey: c.periodKey,
      status: c.status,
    }))
  );
}

export async function refreshPeriodClosings(): Promise<PeriodClosing[]> {
  const db = createDomainDb();
  const { data, error } = await db
    .from("period_closings")
    .select("*")
    .order("period_key", { ascending: false });
  if (error) {
    console.warn(`[closing] refresh: ${error.message}`);
    rebuildGuard();
    return [...closingsCache];
  }
  closingsCache = ((data ?? []) as PeriodRow[]).map(rowToClosing);
  rebuildGuard();
  return [...closingsCache];
}

export function listPeriodClosings(): PeriodClosing[] {
  return [...closingsCache];
}

export function getPeriodClosing(
  periodType: PeriodType,
  periodKey: string
): PeriodClosing | undefined {
  return closingsCache.find(
    (c) =>
      c.periodType === periodType &&
      c.periodKey === periodKey &&
      c.status === "closed"
  );
}

export {
  assertPeriodOpen,
  isPeriodClosedForDate,
} from "@/lib/finance/period-guard";

function buildSnapshot(periodKey: string): Record<string, unknown> {
  const asOf =
    periodKey.length === 7
      ? `${periodKey}-${new Date(
          Date.UTC(
            Number(periodKey.slice(0, 4)),
            Number(periodKey.slice(5, 7)),
            0
          )
        )
          .getUTCDate()
          .toString()
          .padStart(2, "0")}`
      : `${periodKey}-12-31`;

  const cashflow = getCompanyCashflow(asOf);
  const methods = getCompanyMethodWallets();
  const wallet = getCompanyWallet();
  const carryForwardBalances = {
    cashSafe: methods.cashSafe,
    secondaryCashSafe: methods.secondaryCashSafe,
    bank: methods.bank,
    instapay: methods.instapay,
    vodafoneCash: methods.vodafoneCash,
    total: methods.total,
    companyLedgerBalance: wallet.balance,
    pendingCrewPayments: getTotalPendingCrewPayments(),
  };

  return {
    asOf,
    periodKey,
    cashflow,
    carryForwardBalances,
    eventCount: listFinancialEvents().length,
    movementCount: listCashMovements().length,
    closedAt: new Date().toISOString(),
  };
}

export async function closeMonth(input: {
  monthKey: string;
  closedBy?: string;
}): Promise<PeriodClosing> {
  const existing = closingsCache.find(
    (c) =>
      c.periodType === "month" &&
      c.periodKey === input.monthKey &&
      c.status === "closed"
  );
  if (existing) return { ...existing };

  const snapshot = buildSnapshot(input.monthKey);
  const now = new Date().toISOString();
  const closing: PeriodClosing = {
    id: newId("pc"),
    periodType: "month",
    periodKey: input.monthKey,
    status: "closed",
    snapshot,
    closedAt: now,
    closedBy: input.closedBy,
    createdAt: now,
  };

  const db = createDomainDb();
  const { data, error } = await db
    .from("period_closings")
    .upsert(
      {
        id: closing.id,
        period_type: closing.periodType,
        period_key: closing.periodKey,
        status: closing.status,
        snapshot: closing.snapshot,
        closed_at: closing.closedAt,
        closed_by: closing.closedBy ?? null,
        reopened_at: null,
        reopened_by: null,
        reopen_reason: null,
        created_at: closing.createdAt,
      },
      { onConflict: "period_type,period_key" }
    )
    .select("*")
    .single();

  if (error) {
    console.warn(`[closing] closeMonth: ${error.message}`);
    closingsCache = [
      closing,
      ...closingsCache.filter(
        (c) =>
          !(c.periodType === "month" && c.periodKey === input.monthKey)
      ),
    ];
  } else {
    const saved = rowToClosing(data as PeriodRow);
    closingsCache = [
      saved,
      ...closingsCache.filter(
        (c) =>
          !(c.periodType === saved.periodType && c.periodKey === saved.periodKey)
      ),
    ];
  }

  rebuildGuard();

  const result =
    closingsCache.find(
      (c) => c.periodType === "month" && c.periodKey === input.monthKey
    ) ?? closing;

  await publishBusinessEvent({
    type: "PeriodClosed",
    source: "finance.closing.closeMonth",
    payload: {
      entityId: result.id,
      entityType: "system",
      summary: `Month ${input.monthKey} closed`,
      data: {
        periodType: "month",
        periodKey: input.monthKey,
        snapshot: result.snapshot,
      },
    },
  });

  return { ...result };
}

export async function closeYear(input: {
  yearKey: string;
  closedBy?: string;
}): Promise<PeriodClosing> {
  const existing = closingsCache.find(
    (c) =>
      c.periodType === "year" &&
      c.periodKey === input.yearKey &&
      c.status === "closed"
  );
  if (existing) return { ...existing };

  const snapshot = buildSnapshot(input.yearKey);
  const now = new Date().toISOString();
  const closing: PeriodClosing = {
    id: newId("pc"),
    periodType: "year",
    periodKey: input.yearKey,
    status: "closed",
    snapshot,
    closedAt: now,
    closedBy: input.closedBy,
    createdAt: now,
  };

  const db = createDomainDb();
  const { data, error } = await db
    .from("period_closings")
    .upsert(
      {
        id: closing.id,
        period_type: closing.periodType,
        period_key: closing.periodKey,
        status: closing.status,
        snapshot: closing.snapshot,
        closed_at: closing.closedAt,
        closed_by: closing.closedBy ?? null,
        reopened_at: null,
        reopened_by: null,
        reopen_reason: null,
        created_at: closing.createdAt,
      },
      { onConflict: "period_type,period_key" }
    )
    .select("*")
    .single();

  if (error) {
    console.warn(`[closing] closeYear: ${error.message}`);
    closingsCache = [
      closing,
      ...closingsCache.filter(
        (c) => !(c.periodType === "year" && c.periodKey === input.yearKey)
      ),
    ];
  } else {
    const saved = rowToClosing(data as PeriodRow);
    closingsCache = [
      saved,
      ...closingsCache.filter(
        (c) =>
          !(c.periodType === saved.periodType && c.periodKey === saved.periodKey)
      ),
    ];
  }

  rebuildGuard();

  const result =
    closingsCache.find(
      (c) => c.periodType === "year" && c.periodKey === input.yearKey
    ) ?? closing;

  await publishBusinessEvent({
    type: "PeriodClosed",
    source: "finance.closing.closeYear",
    payload: {
      entityId: result.id,
      entityType: "system",
      summary: `Year ${input.yearKey} closed (carry-forward snapshotted)`,
      data: {
        periodType: "year",
        periodKey: input.yearKey,
        carryForward: (result.snapshot as { carryForwardBalances?: unknown })
          .carryForwardBalances,
      },
    },
  });

  return { ...result };
}

export async function reopenPeriod(input: {
  periodType: PeriodType;
  periodKey: string;
  reason: string;
  reopenedBy?: string;
}): Promise<PeriodClosing> {
  const existing = closingsCache.find(
    (c) =>
      c.periodType === input.periodType && c.periodKey === input.periodKey
  );
  if (!existing) {
    throw new Error(
      `No closing found for ${input.periodType} ${input.periodKey}`
    );
  }
  if (existing.status === "reopened") return { ...existing };

  const now = new Date().toISOString();
  const updated: PeriodClosing = {
    ...existing,
    status: "reopened",
    reopenedAt: now,
    reopenedBy: input.reopenedBy,
    reopenReason: input.reason,
  };

  const db = createDomainDb();
  const { data, error } = await db
    .from("period_closings")
    .update({
      status: "reopened",
      reopened_at: now,
      reopened_by: input.reopenedBy ?? null,
      reopen_reason: input.reason,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error) {
    console.warn(`[closing] reopen: ${error.message}`);
    closingsCache = closingsCache.map((c) =>
      c.id === existing.id ? updated : c
    );
  } else {
    const saved = rowToClosing(data as PeriodRow);
    closingsCache = closingsCache.map((c) =>
      c.id === saved.id ? saved : c
    );
  }

  rebuildGuard();

  const result = closingsCache.find((c) => c.id === existing.id) ?? updated;

  await publishBusinessEvent({
    type: "PeriodReopened",
    source: "finance.closing.reopenPeriod",
    payload: {
      entityId: result.id,
      entityType: "system",
      summary: `Reopened ${input.periodType} ${input.periodKey}: ${input.reason}`,
      data: {
        periodType: input.periodType,
        periodKey: input.periodKey,
        reason: input.reason,
      },
    },
  });

  return { ...result };
}
