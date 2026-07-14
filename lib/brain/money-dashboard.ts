/**
 * Founder Money Dashboard — aggregates ONLY brain_entries where workspace=money_memory.
 * Never reads Finance ERP tables for these cards.
 */

import type {
  BrainCurrency,
  BrainEntry,
  MoneyDashboard,
  MoneyKind,
} from "@/lib/brain/types";

function isOpenMoney(entry: BrainEntry): boolean {
  const s = (entry.status ?? "").toLowerCase();
  return s !== "collected" && s !== "cancelled" && s !== "resolved";
}

function amountOf(entry: BrainEntry): number {
  if (typeof entry.amount === "number" && Number.isFinite(entry.amount)) {
    return entry.amount;
  }
  const note = entry.amountNote ?? "";
  const m = note.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : 0;
}

function sumKind(
  entries: BrainEntry[],
  kind: MoneyKind | MoneyKind[],
  openOnly = true
): { total: number; count: number } {
  const kinds = Array.isArray(kind) ? kind : [kind];
  let total = 0;
  let count = 0;
  for (const e of entries) {
    if (!e.moneyKind || !kinds.includes(e.moneyKind)) continue;
    if (openOnly && !isOpenMoney(e)) continue;
    total += amountOf(e);
    count += 1;
  }
  return { total, count };
}

function dominantCurrency(entries: BrainEntry[]): BrainCurrency {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const c = e.currency ?? "EGP";
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best: BrainCurrency = "EGP";
  let n = 0;
  for (const [c, v] of counts) {
    if (v > n) {
      best = c as BrainCurrency;
      n = v;
    }
  }
  return best;
}

export function computeMoneyDashboard(entries: BrainEntry[]): MoneyDashboard {
  const money = entries.filter((e) => e.workspace === "money_memory");
  const waiting = sumKind(money, ["to_collect", "client_debt"]);
  const loansGiven = sumKind(money, "lent");
  const loansTaken = sumKind(money, "debt");
  const crew = sumKind(money, "crew_advance");
  const clientDebt = sumKind(money, "client_debt");

  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 30);
  const horizonIso = horizon.toISOString().slice(0, 10);

  let upcomingCollections = 0;
  let upcomingCount = 0;
  for (const e of money) {
    if (!isOpenMoney(e)) continue;
    if (e.moneyKind !== "to_collect" && e.moneyKind !== "client_debt") continue;
    if (!e.dueAt) continue;
    const day = e.dueAt.slice(0, 10);
    if (day >= today && day <= horizonIso) {
      upcomingCollections += amountOf(e);
      upcomingCount += 1;
    }
  }

  const totalWaiting = waiting.total + crew.total;

  return {
    moneyWaiting: waiting.total,
    loansGiven: loansGiven.total,
    loansTaken: loansTaken.total,
    crewAdvances: crew.total,
    clientDebts: clientDebt.total,
    upcomingCollections,
    totalWaiting,
    currency: dominantCurrency(money),
    recentActivity: money.slice(0, 8),
    counts: {
      waiting: waiting.count,
      loansGiven: loansGiven.count,
      loansTaken: loansTaken.count,
      crewAdvances: crew.count,
      clientDebts: clientDebt.count,
      upcoming: upcomingCount,
    },
  };
}
