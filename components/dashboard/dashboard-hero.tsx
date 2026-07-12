"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  buildHeroOperationalLines,
  getHeroGreeting,
} from "@/lib/dashboard/hero-summary";
import { toEasternDigits } from "@/lib/brand/soda-voice";
import type { DashboardVoiceInput } from "@/lib/brand/types";

interface DashboardHeroProps {
  dashboard: DashboardVoiceInput;
  /** Profile displayName / full_name — never role labels. */
  operatorName?: string | null;
}

/** Client-only local clock — greeting + live date/time. */
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
    second: "2-digit",
    hour12: false,
  }).format(now);
  return toEasternDigits(raw);
}

/**
 * Compact Command Center hero — greeting + premium date/time widget.
 * Compressed so focus content can sit above the fold on normal desktop.
 */
export default function DashboardHero({
  dashboard,
  operatorName,
}: DashboardHeroProps) {
  const now = useLocalNow();
  const hydrated = now.getTime() !== 0;
  const clock = hydrated ? now : new Date();
  const greeting = getHeroGreeting(clock, operatorName);
  const lines = buildHeroOperationalLines(dashboard);

  return (
    <section
      aria-labelledby="dashboard-hero-greeting"
      className="soda-page-enter space-y-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1" dir="rtl">
          <h1
            id="dashboard-hero-greeting"
            className="font-ar text-[1.65rem] leading-[1.3] font-semibold tracking-tight text-foreground sm:text-[2rem] sm:leading-[1.25] lg:text-[2.25rem]"
            suppressHydrationWarning
          >
            {greeting}
          </h1>
          {lines.length > 0 ? (
            <ul className="space-y-0.5" dir="rtl">
              {lines.slice(0, 2).map((line) => (
                <li key={line.text}>
                  <Link
                    href={line.href}
                    className="font-ar cursor-pointer text-sm leading-relaxed text-foreground/80 underline-offset-4 transition-colors hover:text-soda-pink hover:underline sm:text-[0.95rem]"
                  >
                    {line.text}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <aside
          aria-label="التاريخ والوقت"
          className="soda-cc-card relative shrink-0 overflow-hidden rounded-xl border border-soda-pink/20 bg-gradient-to-br from-soda-pink/10 via-card to-soda-purple/10 px-4 py-3 shadow-[0_0_24px_color-mix(in_oklch,var(--soda-pink)_12%,transparent)] sm:min-w-[11.5rem] sm:px-5 sm:py-3.5"
          dir="rtl"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-soda-pink/50 to-transparent" />
          <p
            className="font-ar text-[11px] font-medium tracking-wide text-soda-pink"
            suppressHydrationWarning
          >
            {formatWeekday(clock)}
          </p>
          <p
            className="font-mono mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[1.65rem]"
            suppressHydrationWarning
          >
            {formatLiveTime(clock)}
          </p>
          <p
            className="font-ar mt-1 text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            {formatDate(clock)}
          </p>
        </aside>
      </div>
    </section>
  );
}
