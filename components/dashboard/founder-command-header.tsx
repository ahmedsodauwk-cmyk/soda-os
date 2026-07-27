"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, Plus } from "lucide-react";

import { ClientEntryActions } from "@/components/clients/client-entry-actions";
import { SodaLanguage } from "@/components/brand/soda-language";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Button } from "@/components/ui/button";
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

/** Founder header — Arabic greeting + summary (SODA Language), English date/time + actions. */
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
      className="soda-founder-header flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
          <h1
            id="founder-command-greeting"
            lang="ar"
            dir="rtl"
            className="soda-founder-greeting font-ar min-w-0 font-bold leading-tight tracking-tight text-foreground"
            suppressHydrationWarning
          >
            {greeting}
          </h1>
          <aside
            aria-label="Date and time"
            className="soda-founder-clock shrink-0 rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-left"
          >
            <p
              className="text-sm font-medium text-foreground"
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
          </aside>
        </div>
        {summary ? (
          <SodaLanguage size="header" className="max-w-2xl">
            {summary}
          </SodaLanguage>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
        <ThemeSwitcher className="shrink-0" />

        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-soda-pink/25 text-[15px] font-semibold"
          nativeButton={false}
          render={<Link href="/attention" />}
        >
          <Eye className="size-4" />
          <span>Quick View</span>
        </Button>
        <Button
          size="sm"
          className="soda-btn-primary h-9 gap-1.5 text-[15px] font-semibold"
          nativeButton={false}
          render={<Link href="/orders" />}
        >
          <Plus className="size-4" />
          <span>New Order</span>
        </Button>
        <ClientEntryActions
          triggerLabel="Add Client"
          triggerVariant="outline"
          triggerClassName="h-9 border-soda-pink/25"
        />
      </div>
    </header>
  );
}
