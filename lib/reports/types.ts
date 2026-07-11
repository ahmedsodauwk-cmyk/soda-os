/**
 * Reports foundation — types aligned with Financial Core aggregators.
 */
export type ReportDimension =
  | "workspace"
  | "client"
  | "project"
  | "team"
  | "month"
  | "period"
  | "order";

export type ReportMetric =
  | "revenue"
  | "orders"
  | "projects"
  | "outstandingBalance"
  | "activeClients"
  | "income"
  | "expense"
  | "netProfit"
  | "agreed"
  | "collected"
  | "outstanding"
  | "refunded"
  | "monthlyRevenue"
  | "netProfitMonth"
  | "companyBalance";

export interface ReportFilter {
  workspaceId?: string;
  clientId?: string;
  projectId?: string;
  from?: string;
  to?: string;
}

export interface ReportRow {
  key: string;
  label: string;
  values: Partial<Record<ReportMetric, number>>;
}

export interface ReportDefinition {
  id: string;
  title: string;
  dimension: ReportDimension;
  metrics: ReportMetric[];
  description?: string;
}
