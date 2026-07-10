/**
 * Reports helpers stub — aggregation lives in lib/business; this module
 * will compose report rows in a later sprint.
 */
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
];

export function getReportDefinitions(): ReportDefinition[] {
  return REPORT_DEFINITIONS;
}

export function buildEmptyReport(
  definitionId: string,
  filter?: ReportFilter
): ReportRow[] {
  void definitionId;
  void filter;
  return [];
}
