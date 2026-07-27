import Link from "next/link";
import { FileText, TrendingUp, UsersRound } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toEasternDigits } from "@/lib/brand/soda-voice";
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

function teamStatusSummary(team: TeamPerformanceRow[]): string {
  if (team.length === 0) {
    return "مفيش بيانات طاقم ظاهرة دلوقتي.";
  }
  const active = team.filter((t) => t.currentWorkload > 0);
  if (active.length === 0) {
    return "الطاقم متاح — مفيش ضغط شغل ظاهر.";
  }
  const top = [...active].sort(
    (a, b) => b.currentWorkload - a.currentWorkload
  )[0];
  return `${top.name} عنده أعلى حمل (${toEasternDigits(top.currentWorkload)} أوردر).`;
}

function FinancialPulseUnit({
  financial,
}: {
  financial: FinancialOverview;
}) {
  return (
    <Card className="soda-founder-pulse soda-cc-card">
      <CardHeader className="px-3 py-2 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs font-medium">
          <TrendingUp className="size-3.5 text-soda-pink" />
          <span className="font-ar" dir="rtl">
            نبض مالي
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-2.5 pt-0" dir="rtl">
        <Link
          href={dashboardHref("collected")}
          className="block rounded-md transition-colors hover:bg-muted/30"
        >
          <p className="font-ar text-[10px] text-muted-foreground">محصّل</p>
          <p className="font-mono text-sm font-semibold tabular-nums">
            {formatPrice(financial.collected)}
          </p>
        </Link>
        <Link
          href="/attention"
          className="block rounded-md transition-colors hover:bg-muted/30"
        >
          <p className="font-ar text-[10px] text-muted-foreground">مستحق</p>
          <p className="font-mono text-sm font-semibold tabular-nums text-foreground/90">
            {formatPrice(financial.outstanding)}
          </p>
        </Link>
      </CardContent>
    </Card>
  );
}

function QuotationPulseUnit() {
  const m = computeQuotationMetrics(getBusinessToday());
  const n = toEasternDigits;

  return (
    <Card className="soda-founder-pulse soda-cc-card">
      <CardHeader className="px-3 py-2 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs font-medium">
          <FileText className="size-3.5 text-soda-pink" />
          <span className="font-ar" dir="rtl">
            بايبلاين العروض
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-2.5 pt-0" dir="rtl">
        <Link
          href="/quotations"
          className="flex items-baseline justify-between gap-2 rounded-md transition-colors hover:bg-muted/30"
        >
          <span className="font-ar text-[10px] text-muted-foreground">معلّقة</span>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {n(m.pendingCount)}
          </span>
        </Link>
        <Link
          href="/quotations"
          className="flex items-baseline justify-between gap-2 rounded-md transition-colors hover:bg-muted/30"
        >
          <span className="font-ar text-[10px] text-muted-foreground">قيمة البايبلاين</span>
          <span className="font-mono text-xs font-semibold tabular-nums">
            {formatEgp(m.pipelineValue)}
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}

function TeamPulseUnit({ team }: { team: TeamPerformanceRow[] }) {
  const n = toEasternDigits;
  const onDuty = team.filter((t) => t.currentWorkload > 0).length;

  return (
    <Card className="soda-founder-pulse soda-cc-card">
      <CardHeader className="px-3 py-2 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs font-medium">
          <UsersRound className="size-3.5 text-soda-pink" />
          <span className="font-ar" dir="rtl">
            الطاقم دلوقتي
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-2.5 pt-0" dir="rtl">
        <Link
          href="/people"
          className="block rounded-md transition-colors hover:bg-muted/30"
        >
          <p className="font-mono text-sm font-semibold tabular-nums">
            {n(onDuty)} / {n(team.length)} شغالين
          </p>
          <p className="font-ar mt-1 text-[10px] leading-relaxed text-muted-foreground">
            {teamStatusSummary(team)}
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
    <div className="soda-founder-bottom grid grid-cols-1 gap-2 sm:grid-cols-3">
      {showFinance ? (
        <FinancialPulseUnit financial={dashboard.financial} />
      ) : (
        <Card className="soda-founder-pulse soda-cc-card">
          <CardContent className="flex h-full items-center justify-center px-3 py-4">
            <p className="font-ar text-center text-[10px] text-muted-foreground" dir="rtl">
              الملخص المالي مش متاح لصلاحياتك.
            </p>
          </CardContent>
        </Card>
      )}
      <QuotationPulseUnit />
      <TeamPulseUnit team={dashboard.team} />
    </div>
  );
}
