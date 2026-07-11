/**
 * Crew Wallet — pending / paid earnings per crew member.
 * Built from assignments + optional persisted crew_earnings rows.
 */

import {
  assignmentFinalAmount,
  assignmentRemaining,
  getAssignmentById,
  getAssignments,
  getAssignmentsByOrder,
  getAssignmentsByPerson,
} from "@/lib/assignments/repository";
import { getClientById } from "@/lib/clients/repository";
import {
  CREW_MONTHLY_BONUS_EGP,
  CREW_MONTHLY_BONUS_THRESHOLD,
  isOrderCompleted,
  isOrderOperational,
} from "@/lib/orders/status";
import { getOrderById } from "@/lib/orders/repository";
import { getProjectSeedById } from "@/lib/projects/repository";
import { createDomainDb } from "@/lib/supabase/domain-db";
import type {
  CrewEarning,
  CrewEarningStatus,
  CrewWalletSnapshot,
} from "@/lib/wallets/types";

type CrewEarningRow = {
  id: string;
  person_id: string;
  assignment_id: string | null;
  order_id: string | null;
  client_id: string | null;
  project_id: string | null;
  client_name: string | null;
  project_name: string | null;
  shoot_date: string | null;
  role: string;
  amount: number | string;
  status: string;
  paid_at: string | null;
  financial_event_id: string | null;
  bonus_kind: string | null;
  month_key: string | null;
  created_at: string;
  updated_at: string;
};

let earningsCache: CrewEarning[] = [];

function rowToEarning(row: CrewEarningRow): CrewEarning {
  return {
    id: row.id,
    personId: row.person_id,
    ...(row.assignment_id ? { assignmentId: row.assignment_id } : {}),
    ...(row.order_id ? { orderId: row.order_id } : {}),
    ...(row.client_id ? { clientId: row.client_id } : {}),
    ...(row.project_id ? { projectId: row.project_id } : {}),
    ...(row.client_name ? { clientName: row.client_name } : {}),
    ...(row.project_name ? { projectName: row.project_name } : {}),
    ...(row.shoot_date ? { shootDate: row.shoot_date } : {}),
    role: row.role,
    amount: Number(row.amount) || 0,
    status: row.status as CrewEarningStatus,
    ...(row.paid_at ? { paidAt: row.paid_at } : {}),
    ...(row.financial_event_id
      ? { financialEventId: row.financial_event_id }
      : {}),
    bonusKind:
      row.bonus_kind === "monthly_target" ? "monthly_target" : null,
    ...(row.month_key ? { monthKey: row.month_key } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function earningToRow(e: CrewEarning): Record<string, unknown> {
  return {
    id: e.id,
    person_id: e.personId,
    assignment_id: e.assignmentId ?? null,
    order_id: e.orderId ?? null,
    client_id: e.clientId ?? null,
    project_id: e.projectId ?? null,
    client_name: e.clientName ?? null,
    project_name: e.projectName ?? null,
    shoot_date: e.shootDate ?? null,
    role: e.role,
    amount: e.amount,
    status: e.status,
    paid_at: e.paidAt ?? null,
    financial_event_id: e.financialEventId ?? null,
    bonus_kind: e.bonusKind ?? null,
    month_key: e.monthKey ?? null,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

function monthKeyNow(asOf = new Date()): string {
  return asOf.toISOString().slice(0, 7);
}

function yearKeyNow(asOf = new Date()): string {
  return asOf.toISOString().slice(0, 4);
}

export async function refreshCrewEarnings(): Promise<CrewEarning[]> {
  const db = createDomainDb();
  const { data, error } = await db
    .from("crew_earnings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn(`[crew-wallet] refresh: ${error.message}`);
    return [...earningsCache];
  }
  earningsCache = ((data ?? []) as CrewEarningRow[]).map(rowToEarning);
  return [...earningsCache];
}

export function listCrewEarnings(filter?: {
  personId?: string;
  status?: CrewEarningStatus;
  orderId?: string;
}): CrewEarning[] {
  return earningsCache
    .filter((e) => {
      if (filter?.personId && e.personId !== filter.personId) return false;
      if (filter?.status && e.status !== filter.status) return false;
      if (filter?.orderId && e.orderId !== filter.orderId) return false;
      return true;
    })
    .map((e) => ({ ...e }));
}

async function upsertEarning(earning: CrewEarning): Promise<CrewEarning> {
  const db = createDomainDb();
  const { data, error } = await db
    .from("crew_earnings")
    .upsert(earningToRow(earning), { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    console.warn(`[crew-wallet] upsert: ${error.message}`);
    earningsCache = [
      earning,
      ...earningsCache.filter((e) => e.id !== earning.id),
    ];
    return { ...earning };
  }

  const saved = rowToEarning(data as CrewEarningRow);
  earningsCache = [
    saved,
    ...earningsCache.filter((e) => e.id !== saved.id),
  ];
  return { ...saved };
}

function earningIdForAssignment(assignmentId: string): string {
  return `ce-asg-${assignmentId}`;
}

/**
 * Ensure pending crew earnings exist for operational order assignments.
 * Called by OrderConfirmed / CrewAssigned rules.
 */
export async function syncPendingEarningsForOrder(
  orderId: string
): Promise<CrewEarning[]> {
  const order = getOrderById(orderId);
  if (!order || !isOrderOperational(order.status)) {
    // Cancel pending for non-operational
    const pending = listCrewEarnings({ orderId, status: "pending" });
    const cancelled: CrewEarning[] = [];
    for (const e of pending) {
      if (e.bonusKind === "monthly_target") continue;
      cancelled.push(
        await upsertEarning({
          ...e,
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        })
      );
    }
    return cancelled;
  }

  const client = order.clientId ? getClientById(order.clientId) : undefined;
  const project = order.projectId
    ? getProjectSeedById(order.projectId)
    : undefined;
  const assignments = getAssignmentsByOrder(orderId);
  const results: CrewEarning[] = [];
  const now = new Date().toISOString();

  for (const a of assignments) {
    const remaining = assignmentRemaining(a);
    const final = assignmentFinalAmount(a);
    if (final <= 0) continue;

    const id = earningIdForAssignment(a.id);
    const existing = earningsCache.find((e) => e.id === id);
    const status: CrewEarningStatus =
      remaining <= 0 ? "paid" : "pending";

    const earning: CrewEarning = {
      id,
      personId: a.personId,
      assignmentId: a.id,
      orderId: order.id,
      clientId: order.clientId,
      projectId: order.projectId,
      clientName: client?.name ?? order.clientName,
      projectName: project?.name,
      shootDate: order.shootDate || undefined,
      role: a.role,
      amount: remaining > 0 ? remaining : final,
      status,
      paidAt: status === "paid" ? a.paidAt ?? now.slice(0, 10) : undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    results.push(await upsertEarning(earning));
  }

  return results;
}

/** Mark assignment-linked earning paid after crew payment. */
export async function markCrewEarningPaid(input: {
  assignmentId: string;
  amount: number;
  financialEventId?: string;
  paidAt?: string;
}): Promise<CrewEarning | null> {
  const id = earningIdForAssignment(input.assignmentId);
  const existing =
    earningsCache.find((e) => e.id === id) ??
    listCrewEarnings().find((e) => e.assignmentId === input.assignmentId);
  const asg = getAssignmentById(input.assignmentId);
  if (!existing && !asg) return null;

  const remaining = asg ? assignmentRemaining(asg) : 0;
  const now = new Date().toISOString();
  const paidAt = input.paidAt ?? now.slice(0, 10);

  if (remaining <= 0) {
    const base: CrewEarning = existing ?? {
      id,
      personId: asg!.personId,
      assignmentId: input.assignmentId,
      orderId: asg!.orderId,
      role: asg!.role,
      amount: input.amount,
      status: "paid",
      paidAt,
      financialEventId: input.financialEventId,
      createdAt: now,
      updatedAt: now,
    };
    return upsertEarning({
      ...base,
      amount: asg ? assignmentFinalAmount(asg) : input.amount,
      status: "paid",
      paidAt,
      financialEventId: input.financialEventId ?? base.financialEventId,
      updatedAt: now,
    });
  }

  return upsertEarning({
    id,
    personId: asg?.personId ?? existing!.personId,
    assignmentId: input.assignmentId,
    orderId: asg?.orderId ?? existing?.orderId,
    clientId: existing?.clientId,
    projectId: existing?.projectId,
    clientName: existing?.clientName,
    projectName: existing?.projectName,
    shootDate: existing?.shootDate,
    role: asg?.role ?? existing?.role ?? "Crew",
    amount: remaining,
    status: "pending",
    financialEventId: input.financialEventId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

function completedOrderIdsForPerson(
  personId: string,
  opts: { monthKey?: string; yearKey?: string }
): Set<string> {
  const ids = new Set<string>();
  for (const a of getAssignmentsByPerson(personId)) {
    const order = getOrderById(a.orderId);
    if (!order || !isOrderCompleted(order.status)) continue;
    const key = (order.deliveryDate || order.shootDate || "").slice(0, 7);
    const year = key.slice(0, 4);
    if (opts.monthKey && key !== opts.monthKey) continue;
    if (opts.yearKey && year !== opts.yearKey) continue;
    ids.add(order.id);
  }
  return ids;
}

/**
 * Auto-generate 3500 EGP bonus when crew hits 20 completed orders in a month.
 * Idempotent per person+month.
 */
export async function ensureMonthlyTargetBonus(
  personId: string,
  monthKey: string = monthKeyNow()
): Promise<CrewEarning | null> {
  const completed = completedOrderIdsForPerson(personId, { monthKey });
  if (completed.size < CREW_MONTHLY_BONUS_THRESHOLD) return null;

  const bonusId = `ce-bonus-${personId}-${monthKey}`;
  const existing = earningsCache.find((e) => e.id === bonusId);
  if (existing) return { ...existing };

  const now = new Date().toISOString();
  return upsertEarning({
    id: bonusId,
    personId,
    role: "Monthly Target Bonus",
    amount: CREW_MONTHLY_BONUS_EGP,
    status: "pending",
    bonusKind: "monthly_target",
    monthKey,
    createdAt: now,
    updatedAt: now,
  });
}

/** Derive wallet from persisted earnings + live assignment remainders. */
export function getCrewWallet(personId: string): CrewWalletSnapshot {
  const monthKey = monthKeyNow();
  const yearKey = yearKeyNow();
  const persisted = listCrewEarnings({ personId });

  // Merge live assignment remainders for operational/completed orders
  const byKey = new Map<string, CrewEarning>();
  for (const e of persisted) {
    byKey.set(e.id, e);
  }

  for (const a of getAssignmentsByPerson(personId)) {
    const order = getOrderById(a.orderId);
    if (!order) continue;
    if (!isOrderOperational(order.status) && !isOrderCompleted(order.status)) {
      continue;
    }
    const remaining = assignmentRemaining(a);
    const id = earningIdForAssignment(a.id);
    if (byKey.has(id)) continue;
    if (remaining <= 0 && assignmentFinalAmount(a) <= 0) continue;

    const client = order.clientId ? getClientById(order.clientId) : undefined;
    const project = order.projectId
      ? getProjectSeedById(order.projectId)
      : undefined;
    const now = new Date().toISOString();
    byKey.set(id, {
      id,
      personId,
      assignmentId: a.id,
      orderId: order.id,
      clientId: order.clientId,
      projectId: order.projectId,
      clientName: client?.name ?? order.clientName,
      projectName: project?.name,
      shootDate: order.shootDate || undefined,
      role: a.role,
      amount: remaining > 0 ? remaining : assignmentFinalAmount(a),
      status: remaining > 0 ? "pending" : "paid",
      paidAt: remaining > 0 ? undefined : a.paidAt,
      createdAt: a.createdAt,
      updatedAt: now,
    });
  }

  const earnings = [...byKey.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );

  const pendingTotal = earnings
    .filter((e) => e.status === "pending")
    .reduce((acc, e) => acc + e.amount, 0);
  const paidTotal = earnings
    .filter((e) => e.status === "paid")
    .reduce((acc, e) => acc + e.amount, 0);

  const monthlyCompletedOrders = completedOrderIdsForPerson(personId, {
    monthKey,
  }).size;
  const yearlyCompletedOrders = completedOrderIdsForPerson(personId, {
    yearKey,
  }).size;
  const bonusQualified =
    monthlyCompletedOrders >= CREW_MONTHLY_BONUS_THRESHOLD;

  return {
    personId,
    pendingTotal,
    paidTotal,
    earnings,
    monthlyCompletedOrders,
    yearlyCompletedOrders,
    bonusProgress: Math.min(
      1,
      monthlyCompletedOrders / CREW_MONTHLY_BONUS_THRESHOLD
    ),
    bonusQualified,
    bonusEgp: bonusQualified ? CREW_MONTHLY_BONUS_EGP : 0,
    monthKey,
  };
}

/** Company-wide pending crew liability (assignments + pending bonuses). */
export function getTotalPendingCrewPayments(): number {
  let total = 0;
  for (const a of getAssignments()) {
    const order = getOrderById(a.orderId);
    if (!order) continue;
    if (!isOrderOperational(order.status) && !isOrderCompleted(order.status)) {
      continue;
    }
    total += assignmentRemaining(a);
  }
  for (const e of earningsCache) {
    if (e.status === "pending" && e.bonusKind === "monthly_target") {
      total += e.amount;
    }
  }
  return total;
}
