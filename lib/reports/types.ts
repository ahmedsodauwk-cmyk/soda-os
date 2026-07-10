/**
 * Reports foundation — types/helpers only (module not built this sprint).
 */
export type ReportDimension =
  | "workspace"
  | "client"
  | "project"
  | "team"
  | "month";

export type ReportMetric =
  | "revenue"
  | "orders"
  | "projects"
  | "outstandingBalance"
  | "activeClients";

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
