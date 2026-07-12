"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  buildHeroOperationalLines,
  getHeroGreeting,
} from "@/lib/dashboard/hero-summary";
import type { DashboardVoiceInput } from "@/lib/brand/types";

interface DashboardHeroProps {
  dashboard: DashboardVoiceInput;
  /** Profile full_name when logged in — preferred over Junior Soda. */
  operatorName?: string | null;
}

/** Client-only local time so greeting matches the owner's clock. */
function useLocalNow(): Date {
  const [now, setNow] = useState(() => new Date(0));

  useEffect(() => {
    const boot = window.setTimeout(() => setNow(new Date()), 0);
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, []);

  return now;
}

/**
 * Always-visible Command Center hero.
 * Largest text = time-of-day Arabic greeting; below = real operational lines only.
 */
export default function DashboardHero({
  dashboard,
  operatorName,
}: DashboardHeroProps) {
  const now = useLocalNow();
  const hydrated = now.getTime() !== 0;
  const greeting = hydrated
    ? getHeroGreeting(now, operatorName)
    : getHeroGreeting(new Date(), operatorName);
  const lines = buildHeroOperationalLines(dashboard);

  return (
    <section
      aria-labelledby="dashboard-hero-greeting"
      className="soda-page-enter min-h-[9.5rem] space-y-4 sm:min-h-[10.5rem]"
    >
      <h1
        id="dashboard-hero-greeting"
        className="font-ar text-[2.15rem] leading-[1.25] font-semibold tracking-tight text-foreground sm:text-[2.75rem] sm:leading-[1.2] lg:text-[3.15rem]"
        dir="rtl"
        suppressHydrationWarning
      >
        {greeting}
      </h1>

      {lines.length > 0 ? (
        <ul className="space-y-1.5" dir="rtl">
          {lines.map((line) => (
            <li key={line.text}>
              <Link
                href={line.href}
                className="font-ar text-base leading-[1.75] text-foreground/85 underline-offset-4 transition-colors hover:text-soda-pink hover:underline sm:text-lg sm:leading-[1.7]"
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
