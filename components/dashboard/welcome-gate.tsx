"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight, Moon, Sun, Sunset, X } from "lucide-react";

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
  getWelcomeBackCopy,
  SODA_LAST_VISIT_KEY,
  getTodayVisitKey,
  resolveWelcomeMode,
  type DashboardVoiceInput,
  type DayPeriod,
  type WelcomeMode,
} from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Session-stable welcome mode — read once, mark visit in effect. */
let sessionWelcomeMode: WelcomeMode | undefined;

function readWelcomeMode(): WelcomeMode {
  if (sessionWelcomeMode !== undefined) return sessionWelcomeMode;
  try {
    sessionWelcomeMode = resolveWelcomeMode(
      window.localStorage.getItem(SODA_LAST_VISIT_KEY)
    );
  } catch {
    sessionWelcomeMode = "command_center";
  }
  return sessionWelcomeMode;
}

function subscribeWelcome() {
  return () => {};
}

function useWelcomeMode(): WelcomeMode | null {
  return useSyncExternalStore(
    subscribeWelcome,
    readWelcomeMode,
    () => null
  );
}

interface WelcomeExperienceProps {
  dashboard: DashboardVoiceInput;
  onEnter: () => void;
  mode: "morning_brief" | "welcome_back";
}

const periodIcon: Record<DayPeriod, typeof Sun> = {
  morning: Sun,
  afternoon: Sunset,
  evening: Moon,
};

/**
 * Dense branded welcome hero — Morning Brief or Welcome Back.
 * Answers: What should I focus on today?
 */
export function WelcomeExperience({
  dashboard,
  onEnter,
  mode,
}: WelcomeExperienceProps) {
  const brief =
    mode === "welcome_back"
      ? getWelcomeBackCopy(dashboard)
      : getBriefCopy(dashboard);
  const Icon = periodIcon[brief.period];

  return (
    <Card className="soda-brief-shell soda-page-enter overflow-hidden shadow-none">
      <CardHeader className="relative gap-5 pb-6 pt-6 sm:gap-6 sm:pb-8 sm:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardDescription
            className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase"
            suppressHydrationWarning
          >
            <Icon className="size-3.5 text-soda-pink opacity-90" />
            {brief.label}
          </CardDescription>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 font-normal tracking-wide text-primary"
              suppressHydrationWarning
            >
              {getMoodLabel(brief.mood)}
            </Badge>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onEnter}
              aria-label="Skip to Command Center"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-4 lg:col-span-5" dir="rtl">
            <div className="space-y-3">
              <h2
                className="font-ar text-[1.75rem] leading-[1.35] font-semibold tracking-tight text-foreground sm:text-[2.05rem] sm:leading-[1.3]"
                suppressHydrationWarning
              >
                {brief.greeting}
              </h2>
              <p
                className="font-ar text-base leading-[1.85] text-foreground/80 sm:text-[1.0625rem] sm:leading-[1.8]"
                suppressHydrationWarning
              >
                {brief.hook}
              </p>
            </div>

            <div className="space-y-2.5 border-r-[3px] border-soda-pink/50 pr-4">
              <p className="text-[11px] font-medium tracking-[0.14em] text-soda-pink uppercase">
                Focus today
              </p>
              {brief.lines.map((line) => (
                <p
                  key={line}
                  className="font-ar text-[15px] leading-[1.8] text-foreground/95 sm:text-base"
                  suppressHydrationWarning
                >
                  {line}
                </p>
              ))}
            </div>

            <p
              className="font-ar text-base font-medium leading-[1.75] tracking-tight text-foreground sm:text-lg"
              suppressHydrationWarning
            >
              {brief.closer}
            </p>
          </div>

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
                    i === 0 && "border-soda-pink/30 bg-soda-pink/[0.07]"
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
                    className="font-ar mt-2 text-[13px] leading-[1.7] text-muted-foreground"
                    dir="rtl"
                    suppressHydrationWarning
                  >
                    {stat.whisper}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3.5 lg:col-span-3">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Start here
            </p>

            {brief.priority ? (
              <div className="flex flex-1 flex-col justify-between gap-3.5 rounded-xl border border-soda-pink/30 bg-background/50 p-4 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--soda-pink)_14%,transparent)]">
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
                  className="w-full justify-between border-soda-pink/35 hover:bg-soda-pink/10 hover:text-foreground"
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
                  className="font-ar text-[15px] leading-[1.8] text-muted-foreground"
                  dir="rtl"
                >
                  مفيش ضغط دلوقتي — الستوديو مرتّب. ادخل Command Center ورتّب يومك بهدوء.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                variant="default"
                size="sm"
                className="w-full justify-between"
                onClick={onEnter}
              >
                Enter Command Center
                <ArrowUpRight className="size-3.5 opacity-70" />
              </Button>
              {brief.actions
                .filter((a) => a.emphasis === "secondary")
                .slice(0, 2)
                .map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
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

interface WelcomeGateProps {
  dashboard: DashboardVoiceInput;
  children: React.ReactNode;
}

/**
 * First launch today → Morning Brief
 * Returning after ≥3 days → Welcome Back
 * Same-day return → Command Center directly
 */
export function WelcomeGate({ dashboard, children }: WelcomeGateProps) {
  const mode = useWelcomeMode();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(SODA_LAST_VISIT_KEY, getTodayVisitKey());
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const showWelcome =
    !dismissed &&
    mode != null &&
    (mode === "morning_brief" || mode === "welcome_back");

  if (mode === null) {
    // Avoid flash — render Command Center shell until hydrated
    return <>{children}</>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {showWelcome ? (
        <WelcomeExperience
          dashboard={dashboard}
          mode={mode}
          onEnter={() => setDismissed(true)}
        />
      ) : null}
      <div
        id="command-core"
        className={cn("scroll-mt-24", showWelcome && "opacity-90")}
      >
        {children}
      </div>
    </div>
  );
}
