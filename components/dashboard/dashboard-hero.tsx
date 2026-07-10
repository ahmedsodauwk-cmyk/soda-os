"use client";

import { useSyncExternalStore } from "react";

import {
  buildHeroOperationalLines,
  getHeroGreeting,
} from "@/lib/dashboard/hero-summary";
import type { DashboardVoiceInput } from "@/lib/brand/types";

interface DashboardHeroProps {
  dashboard: DashboardVoiceInput;
}

function subscribe() {
  return () => {};
}

/** Client-only local time so greeting matches the owner's clock. */
function useLocalNow(): Date {
  return useSyncExternalStore(
    subscribe,
    () => new Date(),
    () => new Date(0)
  );
}

/**
 * Always-visible Command Center hero.
 * Largest text = time-of-day Arabic greeting; below = real operational lines only.
 */
export default function DashboardHero({ dashboard }: DashboardHeroProps) {
  const now = useLocalNow();
  const hydrated = now.getTime() !== 0;
  const greeting = hydrated
    ? getHeroGreeting(now)
    : getHeroGreeting(new Date());
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
            <li
              key={line}
              className="font-ar text-base leading-[1.75] text-foreground/85 sm:text-lg sm:leading-[1.7]"
            >
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
