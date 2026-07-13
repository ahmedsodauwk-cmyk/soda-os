import Link from "next/link";

import { RelationshipEmptyState } from "@/components/clients/relationship-empty-state";
import { Badge } from "@/components/ui/badge";
import { getClientPartnershipHistory } from "@/lib/clients/aggregators";
import { CLIENT_BUSINESS_ROLE_LABELS } from "@/lib/clients/workspace";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface ClientPartnershipHistoryPanelProps {
  clientId: string;
}

/**
 * Partner collaborations. Share % / settlement are structure-only when not in DB.
 */
export function ClientPartnershipHistoryPanel({
  clientId,
}: ClientPartnershipHistoryPanelProps) {
  const view = getClientPartnershipHistory(clientId);

  if (!view.isPartner) {
    return (
      <RelationshipEmptyState
        title="Partnership History"
        question="Partnerships?"
        detail={`${view.emptyReason} Current role: ${CLIENT_BUSINESS_ROLE_LABELS[view.role]}.`}
      />
    );
  }

  if (view.rows.length === 0) {
    return (
      <RelationshipEmptyState
        title="Partnership History"
        question="Partnerships?"
        detail={view.emptyReason ?? "No partner projects yet."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-base font-semibold">
          Partnership History
        </h3>
        <p className="text-sm text-muted-foreground">{view.emptyReason}</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/20 text-xs text-muted-foreground">
            <tr>
              <th className="px-3.5 py-3 font-medium">Project</th>
              <th className="px-3.5 py-3 font-medium">Share %</th>
              <th className="px-3.5 py-3 font-medium">Revenue</th>
              <th className="px-3.5 py-3 font-medium">Expenses</th>
              <th className="px-3.5 py-3 font-medium">Net Share</th>
              <th className="px-3.5 py-3 font-medium">Settlement</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => (
              <tr
                key={row.projectId}
                className="border-b border-border/40 last:border-0"
              >
                <td className="px-3.5 py-3">
                  <Link
                    href={`/projects/${row.projectId}`}
                    className="font-medium hover:text-soda-pink"
                  >
                    {row.projectName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {row.projectStatus}
                  </p>
                </td>
                <td className="px-3.5 py-3 text-muted-foreground">
                  {row.sharePercent == null
                    ? "Not recorded yet"
                    : `${row.sharePercent}%`}
                </td>
                <td className="px-3.5 py-3 font-mono">{egp(row.revenue)}</td>
                <td className="px-3.5 py-3 font-mono">{egp(row.expenses)}</td>
                <td className="px-3.5 py-3 text-muted-foreground">
                  {row.netShare == null ? "Not recorded yet" : egp(row.netShare)}
                </td>
                <td className="px-3.5 py-3">
                  <Badge variant="outline">Not recorded yet</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
