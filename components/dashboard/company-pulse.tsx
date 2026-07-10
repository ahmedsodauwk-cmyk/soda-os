import { Activity, AlertTriangle, CheckCircle2, Eye } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DASHBOARD_SECTION_COPY } from "@/lib/brand/soda-voice";
import type { CompanyPulseInsight } from "@/lib/brand/types";
import { cn } from "@/lib/utils";

interface CompanyPulseProps {
  insights: CompanyPulseInsight[];
}

const toneStyles: Record<
  CompanyPulseInsight["tone"],
  { icon: typeof Activity; className: string }
> = {
  good: {
    icon: CheckCircle2,
    className: "border-emerald-500/25 bg-emerald-500/8 text-emerald-400",
  },
  watch: {
    icon: Eye,
    className: "border-soda-pink/25 bg-soda-pink/8 text-soda-pink",
  },
  pressure: {
    icon: AlertTriangle,
    className: "border-amber-500/25 bg-amber-500/8 text-amber-400",
  },
  neutral: {
    icon: Activity,
    className: "border-primary/20 bg-primary/8 text-primary",
  },
};

/**
 * Company Pulse — health summary sentences from snapshot.
 * English labels OK; Arabic/mixed insight via brand voice.
 */
export default function CompanyPulse({ insights }: CompanyPulseProps) {
  const copy = DASHBOARD_SECTION_COPY.companyPulse;

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="soda-cc-card h-full">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription
          className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
          dir="rtl"
        >
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {insights.map((insight) => {
          const tone = toneStyles[insight.tone];
          const Icon = tone.icon;
          return (
            <div
              key={insight.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3.5 py-3",
                tone.className
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0 opacity-90" />
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-medium tracking-[0.12em] uppercase opacity-80">
                  {insight.label}
                </p>
                <p
                  className="font-ar text-[0.9375rem] leading-[1.75] text-foreground/90"
                  dir="rtl"
                >
                  {insight.insight}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
