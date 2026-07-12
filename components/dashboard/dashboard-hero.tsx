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
  /** Profile full_name when logged in — preferred over Junior Soda. */
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

function formatLiveDate(now: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
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
 * Always-visible Command Center hero.
 * Largest text = time-of-day Arabic greeting; live date/time; operational lines.
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
      className="soda-page-enter min-h-[9.5rem] space-y-4 sm:min-h-[10.5rem]"
    >
      <div className="space-y-1.5" dir="rtl">
        <p
          className="font-ar text-sm text-muted-foreground sm:text-base"
          suppressHydrationWarning
        >
          {formatLiveDate(clock)}
          <span className="mx-2 text-muted-foreground/50">·</span>
          <span className="font-mono tabular-nums">{formatLiveTime(clock)}</span>
        </p>
        <h1
          id="dashboard-hero-greeting"
          className="font-ar text-[2.15rem] leading-[1.25] font-semibold tracking-tight text-foreground sm:text-[2.75rem] sm:leading-[1.2] lg:text-[3.15rem]"
          suppressHydrationWarning
        >
          {greeting}
        </h1>
      </div>

      {lines.length > 0 ? (
        <ul className="space-y-1.5" dir="rtl">
          {lines.map((line) => (
            <li key={line.text}>
              <Link
                href={line.href}
                className="font-ar cursor-pointer text-base leading-[1.75] text-foreground/85 underline-offset-4 transition-colors hover:text-soda-pink hover:underline sm:text-lg sm:leading-[1.7]"
              >
                {line.text}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
