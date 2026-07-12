import {
  FileText,
  Handshake,
  Percent,
  Timer,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import StatCard from "@/components/dashboard/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HUMAN_LAYER } from "@/lib/brand";
import { computeQuotationMetrics } from "@/lib/quotations";
import { formatEgp } from "@/lib/quotations/utils";
import { getBusinessToday } from "@/lib/business/types";

export function QuotationPipelineCard() {
  const m = computeQuotationMetrics(getBusinessToday());

  return (
    <Card className="soda-cc-card">
      <CardHeader className="pb-3">
        <CardTitle>Quotation pipeline</CardTitle>
        <CardDescription
          className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
          dir="rtl"
        >
          {HUMAN_LAYER.quotationPipeline}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="Pending"
            value={String(m.pendingCount)}
            icon={FileText}
            href="/quotations"
          />
          <StatCard
            title="Waiting client"
            value={String(m.waitingClientCount)}
            icon={Handshake}
            href="/quotations"
          />
          <StatCard
            title="Waiting deposit"
            value={String(m.waitingDepositCount)}
            icon={Wallet}
            href="/quotations"
          />
          <StatCard
            title="Pipeline value"
            value={formatEgp(m.pipelineValue)}
            icon={TrendingUp}
            href="/quotations"
          />
          <StatCard
            title="Won this month"
            value={String(m.wonThisMonth)}
            icon={TrendingUp}
            trend="up"
            href="/quotations"
          />
          <StatCard
            title="Lost this month"
            value={String(m.lostThisMonth)}
            icon={TrendingDown}
            trend={m.lostThisMonth > 0 ? "down" : "neutral"}
            href="/quotations"
          />
          <StatCard
            title="Conversion rate"
            value={
              m.conversionRate == null ? "—" : `${m.conversionRate}%`
            }
            icon={Percent}
            href="/quotations"
          />
          <StatCard
            title="Avg approval time"
            value={
              m.averageApprovalDays == null
                ? "—"
                : `${m.averageApprovalDays}d`
            }
            icon={Timer}
            href="/quotations"
          />
        </div>
      </CardContent>
    </Card>
  );
}
