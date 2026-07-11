/**
 * Reports — compose from Financial Core aggregators (no ad-hoc math).
 */
import { getClients } from "@/lib/clients/repository";
import {
  getClientProfileStats,
  getFinancialOverviewFromCore,
  getFinancialReportSnapshot,
} from "@/lib/core/rules/aggregators";
import { getCompanyCashflow } from "@/lib/finance/cashflow";
import { listOrderFinancialSnapshots } from "@/lib/finance/order-status";
import type {
  ReportDefinition,
  ReportFilter,
  ReportRow,
} from "@/lib/reports/types";

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "revenue-by-workspace",
    title: "Revenue by Workspace",
    dimension: "workspace",
    metrics: ["revenue", "orders", "projects"],
    description: "Studio P&L by production lane",
  },
  {
    id: "client-outstanding",
    title: "Client Outstanding Balance",
    dimension: "client",
    metrics: ["outstandingBalance", "revenue", "orders"],
  },
  {
    id: "company-cashflow",
    title: "Company Cashflow",
    dimension: "period",
    metrics: ["income", "expense", "netProfit"],
    description: "Today / month / year from Financial Core",
  },
  {
    id: "order-financial-status",
    title: "Order Financial Status",
    dimension: "order",
    metrics: ["agreed", "collected", "outstanding", "refunded"],
  },
];

export function getReportDefinitions(): ReportDefinition[] {
  return REPORT_DEFINITIONS;
}

export function buildEmptyReport(
  definitionId: string,
  filter?: ReportFilter
): ReportRow[] {
  void filter;
  return buildReport(definitionId);
}

/** Build live report rows from Financial Core. */
export function buildReport(definitionId: string): ReportRow[] {
  const report = getFinancialReportSnapshot();
  const overview = getFinancialOverviewFromCore();
  const cashflow = getCompanyCashflow();

  if (definitionId === "client-outstanding") {
    return getClients().map((c) => {
      const stats = getClientProfileStats(c.id);
      return {
        key: c.id,
        label: c.name,
        values: {
          outstandingBalance: stats.outstanding,
          revenue: stats.revenue,
          orders: stats.totalOrders,
        },
      };
    });
  }

  if (definitionId === "company-cashflow") {
    return [
      {
        key: "today",
        label: "Today",
        values: {
          income: cashflow.today.income,
          expense: cashflow.today.expense,
          netProfit: cashflow.today.net,
        },
      },
      {
        key: cashflow.month.key,
        label: `Month ${cashflow.month.key}`,
        values: {
          income: cashflow.month.income,
          expense: cashflow.month.expense,
          netProfit: cashflow.netProfitMonth,
        },
      },
      {
        key: cashflow.year.key,
        label: `Year ${cashflow.year.key}`,
        values: {
          income: cashflow.year.income,
          expense: cashflow.year.expense,
          netProfit: cashflow.netProfitYear,
        },
      },
    ];
  }

  if (definitionId === "order-financial-status") {
    return listOrderFinancialSnapshots().map((s) => ({
      key: s.orderId,
      label: s.orderId,
      values: {
        agreed: s.agreed,
        collected: s.collected,
        outstanding: s.outstanding,
        refunded: s.refunded,
      },
    }));
  }

  return [
    {
      key: "company",
      label: "Company",
      values: {
        revenue: overview.revenue,
        collected: overview.collected,
        outstanding: overview.outstanding,
        monthlyRevenue: report.monthlyRevenue,
        netProfitMonth: report.netProfitMonth,
        companyBalance: report.companyBalance,
      },
    },
  ];
}
