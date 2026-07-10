"use client";

import Link from "next/link";
import { ArrowUpRight, Moon, Sun, Sunset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
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
    "border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-background to-background",
  afternoon:
    "border-orange-500/20 bg-gradient-to-br from-orange-500/[0.07] via-background to-background",
  evening:
    "border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.09] via-background to-background",
};

/**
 * Time-aware SODA hero: Morning Brief / Afternoon Check-in / Evening Summary.
 * Filled multi-column layout — greeting, live pulse, priority, CTAs.
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
      <CardHeader className="gap-6 pb-6 pt-6 sm:pb-8 sm:pt-8">
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

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Voice column */}
          <div className="space-y-5 lg:col-span-5" dir="rtl">
            <div className="space-y-3.5">
              <h2
                className="font-ar text-2xl leading-[1.45] font-semibold tracking-tight text-foreground sm:text-[1.85rem] sm:leading-[1.4]"
                suppressHydrationWarning
              >
                {brief.greeting}
              </h2>
              <p
                className="font-ar text-[15px] leading-[1.75] text-foreground/70 sm:text-base sm:leading-[1.7]"
                suppressHydrationWarning
              >
                {brief.hook}
              </p>
            </div>

            <div className="space-y-2 border-r border-border/60 pr-4">
              {brief.lines.map((line) => (
                <p
                  key={line}
                  className="font-ar text-[15px] leading-[1.7] text-foreground/85"
                  suppressHydrationWarning
                >
                  {line}
                </p>
              ))}
            </div>

            <p
              className="font-ar text-base font-medium leading-[1.65] tracking-tight text-foreground sm:text-lg"
              suppressHydrationWarning
            >
              {brief.closer}
            </p>
          </div>

          {/* Today's pulse */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Today&apos;s pulse
            </p>
            <div className="grid grid-cols-2 gap-3">
              {brief.summary.map((stat) => (
                <div
                  key={stat.key}
                  className="rounded-xl border border-border/50 bg-background/40 px-3.5 py-3.5"
                >
                  <p className="text-[11px] tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p
                    className="mt-1.5 font-mono text-2xl font-semibold tracking-tight tabular-nums"
                    suppressHydrationWarning
                  >
                    {stat.value}
                  </p>
                  <p
                    className="font-ar mt-2 text-xs leading-relaxed text-muted-foreground/90"
                    dir="rtl"
                    suppressHydrationWarning
                  >
                    {stat.whisper}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Priority + CTAs */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Focus
            </p>

            {brief.priority ? (
              <div className="flex flex-1 flex-col justify-between gap-4 rounded-xl border border-border/50 bg-background/40 p-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    {brief.priority.eyebrow}
                  </p>
                  <p className="text-sm leading-snug font-medium text-foreground">
                    {brief.priority.title}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {brief.priority.detail}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  nativeButton={false}
                  render={<Link href={brief.priority.href} />}
                >
                  {brief.priority.ctaLabel}
                  <ArrowUpRight className="size-3.5 opacity-70" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-center rounded-xl border border-border/50 bg-background/40 p-4">
                <p
                  className="font-ar text-sm leading-relaxed text-muted-foreground"
                  dir="rtl"
                >
                  مفيش ضغط دلوقتي — الستوديو مرتّب.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {brief.actions.map((action) => (
                <Button
                  key={action.label}
                  variant={
                    action.emphasis === "primary" ? "default" : "outline"
                  }
                  size="sm"
                  className="w-full justify-between"
                  nativeButton={false}
                  render={<Link href={action.href} />}
                >
                  {action.label}
                  <ArrowUpRight className="size-3.5 opacity-70" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
