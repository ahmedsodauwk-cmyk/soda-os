"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";

import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  buildHeroOperationalLines,
  getHeroGreeting,
} from "@/lib/dashboard/hero-summary";
import { toEasternDigits } from "@/lib/brand/soda-voice";
import type { DashboardVoiceInput } from "@/lib/brand/types";

interface FounderCommandHeaderProps {
  dashboard: DashboardVoiceInput;
  operatorName?: string | null;
}

function useLocalNow(): Date {
  const [now, setNow] = useState(() => new Date(0));

  useEffect(() => {
    const boot = window.setTimeout(() => setNow(new Date()), 0);
    const id = window.setInterval(() => setNow(new Date()), 1_000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, []);

  return now;
}

function formatWeekday(now: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long" }).format(now);
}

function formatDate(now: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

function formatLiveTime(now: Date): string {
  const raw = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return toEasternDigits(raw);
}

/** Compact Founder header — greeting, live clock, summary, theme + key actions. */
export function FounderCommandHeader({
  dashboard,
  operatorName,
}: FounderCommandHeaderProps) {
  const now = useLocalNow();
  const hydrated = now.getTime() !== 0;
  const clock = hydrated ? now : new Date();
  const greeting = getHeroGreeting(clock, operatorName);
  const lines = buildHeroOperationalLines(dashboard);
  const summary = lines[0]?.text ?? null;

  return (
    <header
      aria-labelledby="founder-command-greeting"
      className="soda-founder-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1 space-y-0.5" dir="rtl">
        <h1
          id="founder-command-greeting"
          className="font-ar text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.35rem]"
          suppressHydrationWarning
        >
          {greeting}
        </h1>
        {summary ? (
          <p className="font-ar text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
            {summary}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <aside
          aria-label="التاريخ والوقت"
          className="soda-founder-clock flex items-center gap-2 rounded-lg border border-border/60 bg-card/50 px-2.5 py-1.5"
          dir="rtl"
        >
          <div className="min-w-0 text-end">
            <p
              className="font-ar text-[10px] font-medium text-soda-pink"
              suppressHydrationWarning
            >
              {formatWeekday(clock)}
            </p>
            <p
              className="font-mono text-sm font-semibold tabular-nums"
              suppressHydrationWarning
            >
              {formatLiveTime(clock)}
            </p>
          </div>
          <p
            className="font-ar hidden border-s border-border/50 ps-2 text-[10px] text-muted-foreground sm:block"
            suppressHydrationWarning
          >
            {formatDate(clock)}
          </p>
        </aside>

        <ThemeSwitcher className="shrink-0" />

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-soda-pink/25 text-xs"
          nativeButton={false}
          render={<Link href="/quotations/new" />}
        >
          <FileText className="size-3.5" />
          <span className="hidden sm:inline">عرض سعر</span>
        </Button>
        <Button
          size="sm"
          className="soda-btn-primary h-8 gap-1.5 text-xs"
          nativeButton={false}
          render={<Link href="/orders" />}
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">أوردر</span>
        </Button>
      </div>
    </header>
  );
}
