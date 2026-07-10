"use client";

import { Moon, Sun, Sunset } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getBriefCopy,
  type DashboardVoiceInput,
  type DayPeriod,
} from "@/lib/brand/soda-voice";
import { cn } from "@/lib/utils";

interface SodaBriefProps {
  dashboard: DashboardVoiceInput;
  className?: string;
}

const periodIcon: Record<DayPeriod, typeof Sun> = {
  morning: Sun,
  afternoon: Sunset,
  evening: Moon,
};

const periodAccent: Record<DayPeriod, string> = {
  morning: "border-amber-500/20 bg-amber-500/[0.04]",
  afternoon: "border-orange-500/15 bg-orange-500/[0.03]",
  evening: "border-indigo-500/20 bg-indigo-500/[0.04]",
};

/**
 * Time-aware SODA voice card: Morning Brief / Midday Check-in / Evening Summary.
 * Greeting uses live local time; business lines map existing dashboard signals.
 */
export default function SodaBrief({ dashboard, className }: SodaBriefProps) {
  const brief = getBriefCopy(dashboard);
  const Icon = periodIcon[brief.period];

  return (
    <Card className={cn(periodAccent[brief.period], className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardDescription
              className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase"
              suppressHydrationWarning
            >
              <Icon className="size-3.5" />
              {brief.label}
            </CardDescription>
            <CardTitle
              className="text-lg font-semibold tracking-tight"
              suppressHydrationWarning
            >
              {brief.greeting}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
          {brief.body}
        </p>
        {brief.insight ? (
          <p
            className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            {brief.insight}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
