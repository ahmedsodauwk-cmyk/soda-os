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

/**
 * Time-aware SODA hero: Morning Brief / Afternoon Check-in / Evening Summary.
 * Brand purple/pink shell — answers “What should I focus on today?”
 */
export default function SodaBrief({ dashboard, className }: SodaBriefProps) {
  const brief = getBriefCopy(dashboard);
  const Icon = periodIcon[brief.period];

  return (
    <Card
      className={cn(
        "soda-brief-shell overflow-hidden shadow-none",
        className
      )}
    >
      <CardHeader className="relative gap-5 pb-6 pt-6 sm:gap-6 sm:pb-7 sm:pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardDescription
            className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase"
            suppressHydrationWarning
          >
            <Icon className="size-3.5 text-primary opacity-90" />
            {brief.label}
          </CardDescription>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 font-normal tracking-wide text-primary"
            suppressHydrationWarning
          >
            {getMoodLabel(brief.mood)}
          </Badge>
        </div>

        <div className="grid gap-7 lg:grid-cols-12 lg:gap-8">
          {/* Voice column */}
          <div className="space-y-4 lg:col-span-5" dir="rtl">
            <div className="space-y-3">
              <h2
                className="font-ar text-[1.65rem] leading-[1.4] font-semibold tracking-tight text-foreground sm:text-[1.95rem] sm:leading-[1.35]"
                suppressHydrationWarning
              >
                {brief.greeting}
              </h2>
              <p
                className="font-ar text-base leading-[1.8] text-foreground/75 sm:text-[1.0625rem] sm:leading-[1.75]"
                suppressHydrationWarning
              >
                {brief.hook}
              </p>
            </div>

            <div className="space-y-2 border-r-2 border-primary/35 pr-4">
              {brief.lines.map((line) => (
                <p
                  key={line}
                  className="font-ar text-[15px] leading-[1.75] text-foreground/90 sm:text-base"
                  suppressHydrationWarning
                >
                  {line}
                </p>
              ))}
            </div>

            <p
              className="font-ar text-base font-medium leading-[1.7] tracking-tight text-foreground sm:text-lg"
              suppressHydrationWarning
            >
              {brief.closer}
            </p>
          </div>

          {/* Today's pulse */}
          <div className="flex flex-col gap-3.5 lg:col-span-4">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Today&apos;s pulse
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {brief.summary.map((stat, i) => (
                <div
                  key={stat.key}
                  className={cn(
                    "rounded-xl border border-border/60 bg-background/50 px-3.5 py-3.5",
                    i === 0 && "border-primary/25 bg-primary/[0.06]"
                  )}
                >
                  <p className="text-[11px] tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p
                    className="mt-1.5 font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground"
                    suppressHydrationWarning
                  >
                    {stat.value}
                  </p>
                  <p
                    className="font-ar mt-2 text-[13px] leading-relaxed text-muted-foreground"
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
          <div className="flex flex-col gap-3.5 lg:col-span-3">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Focus today
            </p>

            {brief.priority ? (
              <div className="flex flex-1 flex-col justify-between gap-3.5 rounded-xl border border-soda-pink/25 bg-background/50 p-4 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--soda-pink)_12%,transparent)]">
                <div className="space-y-2">
                  <p className="text-[11px] font-medium tracking-[0.12em] text-soda-pink uppercase">
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
                  className="w-full justify-between border-primary/30 hover:bg-primary/10 hover:text-foreground"
                  nativeButton={false}
                  render={<Link href={brief.priority.href} />}
                >
                  {brief.priority.ctaLabel}
                  <ArrowUpRight className="size-3.5 opacity-70" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-center rounded-xl border border-border/60 bg-background/50 p-4">
                <p
                  className="font-ar text-[15px] leading-relaxed text-muted-foreground"
                  dir="rtl"
                >
                  مفيش ضغط دلوقتي — الستوديو مرتّب. خد لحظة ترتّب الأولويات بهدوء.
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
