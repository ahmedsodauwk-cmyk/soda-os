"use client";

import { useEffect, useState } from "react";

import { SodaLanguage } from "@/components/brand/soda-language";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import {
  buildHeroOperationalLines,
  getHeroGreeting,
} from "@/lib/dashboard/hero-summary";
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

function formatEnglishDate(now: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

function formatEnglishTime(now: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
}

/** Founder header — Arabic greeting anchor, SODA Language, English date/time below. */
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
      className="soda-founder-header flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h1
          id="founder-command-greeting"
          lang="ar"
          dir="rtl"
          className="soda-founder-greeting font-ar min-w-0 font-bold leading-tight tracking-tight text-foreground"
          suppressHydrationWarning
        >
          {greeting}
        </h1>
        {summary ? (
          <SodaLanguage size="header" className="max-w-2xl">
            {summary}
          </SodaLanguage>
        ) : null}
        <div
          aria-label="Date and time"
          className="soda-founder-clock pt-0.5 text-left"
        >
          <p
            className="text-sm font-medium text-muted-foreground"
            suppressHydrationWarning
          >
            {formatEnglishDate(clock)}
          </p>
          <p
            className="font-mono text-[15px] font-semibold tabular-nums text-soda-pink"
            suppressHydrationWarning
          >
            {formatEnglishTime(clock)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center sm:pt-1">
        <ThemeSwitcher className="shrink-0" />
      </div>
    </header>
  );
}
