"use client";

import { Moon, Sun, Sunset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  getBriefCopy,
  getMoodLabel,
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
  morning:
    "border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] via-background to-background",
  afternoon:
    "border-orange-500/20 bg-gradient-to-br from-orange-500/[0.06] via-background to-background",
  evening:
    "border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.08] via-background to-background",
};

/**
 * Time-aware SODA hero: Morning Brief / Afternoon Check-in / Evening Summary.
 * Large greeting + multi-line teammate copy from live dashboard signals.
 */
export default function SodaBrief({ dashboard, className }: SodaBriefProps) {
  const brief = getBriefCopy(dashboard);
  const Icon = periodIcon[brief.period];

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-none",
        periodAccent[brief.period],
        className
      )}
    >
      <CardHeader className="gap-5 pb-2 pt-6 sm:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardDescription
            className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase"
            suppressHydrationWarning
          >
            <Icon className="size-3.5 opacity-80" />
            {brief.label}
          </CardDescription>
          <Badge
            variant="outline"
            className="font-normal tracking-wide text-muted-foreground"
            suppressHydrationWarning
          >
            {getMoodLabel(brief.mood)}
          </Badge>
        </div>

        <div className="space-y-3" dir="rtl">
          <h2
            className="font-heading text-2xl leading-snug font-semibold tracking-tight text-foreground sm:text-3xl sm:leading-tight"
            suppressHydrationWarning
          >
            {brief.greeting}
          </h2>
          <p
            className="text-base leading-relaxed text-muted-foreground sm:text-lg"
            suppressHydrationWarning
          >
            {brief.hook}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pb-6 pt-2 sm:pb-8 sm:pt-4">
        <div className="space-y-2.5" dir="rtl">
          {brief.lines.map((line) => (
            <p
              key={line}
              className="text-[15px] leading-relaxed text-foreground/85 sm:text-base"
              suppressHydrationWarning
            >
              {line}
            </p>
          ))}
        </div>

        <p
          className="text-base font-medium leading-relaxed tracking-tight text-foreground sm:text-lg"
          dir="rtl"
          suppressHydrationWarning
        >
          {brief.closer}
        </p>
      </CardContent>
    </Card>
  );
}
