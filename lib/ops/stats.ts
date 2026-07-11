/**
 * Smart Ops statistics — top clients/projects/crew, monthly/yearly, completion.
 * Reads Business Core aggregators + Financial Core snapshots only.
 */
import { getBusinessToday } from "@/lib/business/types";
import {
  getClientProfileStats,
  getFinancialOverviewFromCore,
  getFinancialReportSnapshot,
} from "@/lib/core/rules/aggregators";
import { listOrderFinancialSnapshots } from "@/lib/finance/order-status";
import { getAssignments } from "@/lib/assignments/repository";
import { getClients } from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import { isOrderCompleted } from "@/lib/orders/status";
import { getPeople } from "@/lib/people/repository";
import { getProjects } from "@/lib/projects/repository";
import { calculateProjectFinance } from "@/lib/finance/calculators";

export interface RankedStatRow {
  id: string;
  label: string;
  detail: string;
  value: number;
  href: string;
}

export interface OperationsStatistics {
  asOf: string;
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenue: number;
  collected: number;
  outstanding: number;
  completionRate: number;
  completedOrders: number;
  totalOrders: number;
  topClients: RankedStatRow[];
  topProjects: RankedStatRow[];
  topCrew: RankedStatRow[];
}

export function getOperationsStatistics(
  asOf: string = getBusinessToday()
): OperationsStatistics {
  const report = getFinancialReportSnapshot(asOf);
  const overview = getFinancialOverviewFromCore();
  const orders = getOrders().filter((o) => o.status !== "Cancelled");
  const completed = orders.filter((o) => isOrderCompleted(o.status));
  const completionRate =
    orders.length === 0 ? 0 : completed.length / orders.length;

  const topClients: RankedStatRow[] = getClients()
    .map((c) => {
      const stats = getClientProfileStats(c.id);
      return {
        id: c.id,
        label: c.name,
        detail: `${stats.totalOrders} orders · outstanding ${stats.outstanding}`,
        value: stats.collected || stats.revenue,
        href: `/clients/${c.id}`,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const topProjects: RankedStatRow[] = getProjects()
    .map((p) => {
      const fin = calculateProjectFinance(p.id);
      return {
        id: p.id,
        label: p.name,
        detail: `${p.status} · profit ${fin.profit}`,
        value: fin.revenue,
        href: `/projects/${p.id}`,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const completedByPerson = new Map<string, number>();
  for (const a of getAssignments()) {
    const order = orders.find((o) => o.id === a.orderId);
    if (!order || !isOrderCompleted(order.status)) continue;
    completedByPerson.set(
      a.personId,
      (completedByPerson.get(a.personId) ?? 0) + 1
    );
  }

  const topCrew: RankedStatRow[] = getPeople()
    .map((person) => {
      const count = completedByPerson.get(person.id) ?? 0;
      return {
        id: person.id,
        label: person.nickname || person.nameEn || person.nameAr,
        detail: `${person.jobTitle || "Crew"} · ${count} completed`,
        value: count,
        href: `/crew/${person.id}`,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  void listOrderFinancialSnapshots;

  return {
    asOf,
    monthlyRevenue: report.monthlyRevenue,
    yearlyRevenue: report.yearlyRevenue,
    revenue: overview.revenue,
    collected: overview.collected,
    outstanding: overview.outstanding,
    completionRate,
    completedOrders: completed.length,
    totalOrders: orders.length,
    topClients,
    topProjects,
    topCrew,
  };
}
