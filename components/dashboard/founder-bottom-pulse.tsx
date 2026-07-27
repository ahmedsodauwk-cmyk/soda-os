import Link from "next/link";
import { FileText, TrendingUp, UsersRound } from "lucide-react";

import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type {
  DashboardSnapshot,
  FinancialOverview,
  TeamPerformanceRow,
} from "@/lib/dashboard/types";
import { computeQuotationMetrics } from "@/lib/quotations";
import { formatEgp } from "@/lib/quotations/utils";
import { getBusinessToday } from "@/lib/business/types";
import { formatPrice } from "@/lib/orders/utils";
import { dashboardHref } from "@/lib/identity/navigation";

function teamStatusSummaryEn(team: TeamPerformanceRow[]): string {
  if (team.length === 0) {
    return "No crew data visible right now.";
  }
  const active = team.filter((t) => t.currentWorkload > 0);
  if (active.length === 0) {
    return "Crew available — no workload pressure showing.";
  }
  const top = [...active].sort(
    (a, b) => b.currentWorkload - a.currentWorkload
  )[0];
  return `${top.name} has the highest load (${top.currentWorkload} orders).`;
}

function FinancialPulseUnit({
  financial,
}: {
  financial: FinancialOverview;
}) {
  return (
    <Card className="soda-founder-pulse soda-cc-card min-w-0">
      <CardHeader className="px-3 py-2 pb-1">
        <SodaSectionHeader
          title="Financial Pulse"
          layer="financialPulse"
          as="h2"
          size="compact"
          guidanceSize="compact"
        />
      </CardHeader>
      <CardContent className="space-y-1.5 px-3 pb-2.5 pt-0">
        <Link
          href={dashboardHref("collected")}
          className="block rounded-md transition-colors hover:bg-muted/30"
        >
          <p className="text-sm text-muted-foreground">Collected</p>
          <p className="font-mono text-base font-bold tabular-nums">
            {formatPrice(financial.collected)}
          </p>
        </Link>
        <Link
          href="/attention"
          className="block rounded-md transition-colors hover:bg-muted/30"
        >
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="font-mono text-base font-bold tabular-nums text-foreground/90">
            {formatPrice(financial.outstanding)}
          </p>
        </Link>
      </CardContent>
    </Card>
  );
}

function QuotationPulseUnit() {
  const m = computeQuotationMetrics(getBusinessToday());

  return (
    <Card className="soda-founder-pulse soda-cc-card min-w-0">
      <CardHeader className="px-3 py-2 pb-1">
        <SodaSectionHeader
          title="Quotation Pipeline"
          layer="quotationPipeline"
          as="h2"
          size="compact"
          guidanceSize="compact"
        />
      </CardHeader>
      <CardContent className="space-y-1.5 px-3 pb-2.5 pt-0">
        <Link
          href="/quotations"
          className="flex items-baseline justify-between gap-2 rounded-md transition-colors hover:bg-muted/30"
        >
          <span className="text-sm text-muted-foreground">Pending</span>
          <span className="font-mono text-base font-bold tabular-nums">
            {m.pendingCount}
          </span>
        </Link>
        <Link
          href="/quotations"
          className="flex items-baseline justify-between gap-2 rounded-md transition-colors hover:bg-muted/30"
        >
          <span className="text-sm text-muted-foreground">Pipeline value</span>
          <span className="font-mono text-sm font-bold tabular-nums">
            {formatEgp(m.pipelineValue)}
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}

function TeamPulseUnit({ team }: { team: TeamPerformanceRow[] }) {
  const onDuty = team.filter((t) => t.currentWorkload > 0).length;

  return (
    <Card className="soda-founder-pulse soda-cc-card min-w-0">
      <CardHeader className="px-3 py-2 pb-1">
        <SodaSectionHeader
          title="Team Availability"
          layer="teamAvailability"
          as="h2"
          size="compact"
          guidanceSize="compact"
        />
      </CardHeader>
      <CardContent className="px-3 pb-2.5 pt-0">
        <Link
          href="/people"
          className="block rounded-md transition-colors hover:bg-muted/30"
        >
          <p className="font-mono text-base font-bold tabular-nums">
            {onDuty} / {team.length} on duty
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {teamStatusSummaryEn(team)}
          </p>
        </Link>
      </CardContent>
    </Card>
  );
}

interface FounderBottomPulseProps {
  dashboard: DashboardSnapshot;
  showFinance?: boolean;
}

/** Bottom compact row — financial, quotations, team status. */
export function FounderBottomPulse({
  dashboard,
  showFinance = true,
}: FounderBottomPulseProps) {
  return (
    <div className="soda-founder-bottom grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
      {showFinance ? (
        <FinancialPulseUnit financial={dashboard.financial} />
      ) : (
        <Card className="soda-founder-pulse soda-cc-card min-w-0">
          <CardContent className="flex h-full items-center justify-center px-3 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Financial summary not available for your permissions.
            </p>
          </CardContent>
        </Card>
      )}
      <QuotationPulseUnit />
      <TeamPulseUnit team={dashboard.team} />
    </div>
  );
}
