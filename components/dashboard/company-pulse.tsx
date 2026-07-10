"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Eye } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  COMPANY_PULSE_STABLE,
  DASHBOARD_SECTION_COPY,
} from "@/lib/brand/soda-voice";
import type { CompanyPulseInsight } from "@/lib/brand/types";
import { cn } from "@/lib/utils";

interface CompanyPulseProps {
  insights: CompanyPulseInsight[];
}

const PULSE_ROTATE_MS = 10_000;

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
 * Company Pulse — rotates real operational alerts every 10s.
 * Empty → exact stable message.
 */
export default function CompanyPulse({ insights }: CompanyPulseProps) {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const copy = DASHBOARD_SECTION_COPY.companyPulse;

  useEffect(() => {
    if (insights.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % insights.length);
      setTick((t) => t + 1);
    }, PULSE_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [insights.length]);

  const insight = insights[index];

  return (
    <Card className="soda-cc-card h-full min-h-[11rem]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              {copy.description}
            </CardDescription>
          </div>
          {insights.length > 1 ? (
            <span className="font-mono text-[10px] text-muted-foreground">
              {index + 1}/{insights.length}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="min-h-[4.5rem]">
        {insights.length === 0 || !insight ? (
          <p
            className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
            dir="rtl"
          >
            {COMPANY_PULSE_STABLE}
          </p>
        ) : (
          <div
            key={`${insight.id}-${tick}`}
            className={cn(
              "soda-live-fade-enter flex items-start gap-3 rounded-xl border px-3.5 py-3",
              toneStyles[insight.tone].className
            )}
          >
            {(() => {
              const Icon = toneStyles[insight.tone].icon;
              return <Icon className="mt-0.5 size-4 shrink-0 opacity-90" />;
            })()}
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-medium tracking-[0.12em] uppercase opacity-80">
                {insight.label}
              </p>
              <p className="text-sm leading-relaxed text-foreground/90">
                {insight.insight}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
