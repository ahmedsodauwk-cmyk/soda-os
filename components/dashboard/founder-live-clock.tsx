"use client";

import { useEffect, useState } from "react";

function formatEnglishDate(now: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

function formatEnglishTimeWithSeconds(now: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
}

function formatTimeZoneLabel(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZoneName: "short",
  }).formatToParts(now);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "Local";
}

/** Live clock card — upper-right; client-only tick to avoid hydration mismatch. */
export function FounderLiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date(0));

  useEffect(() => {
    const boot = window.setTimeout(() => setNow(new Date()), 0);
    const id = window.setInterval(() => setNow(new Date()), 1_000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, []);

  const clock = now;
  const hydrated = now.getTime() !== 0;

  return (
    <aside
      aria-label="Live clock"
      className={className}
    >
      <div className="soda-founder-clock-card rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-left shadow-sm">
        <p
          className="font-mono text-2xl font-bold tabular-nums leading-none text-soda-pink sm:text-[1.65rem]"
          suppressHydrationWarning
        >
          {hydrated ? formatEnglishTimeWithSeconds(clock) : "—:—:—"}
        </p>
        <p
          className="mt-1.5 text-sm font-medium text-muted-foreground"
          suppressHydrationWarning
        >
          {hydrated ? formatEnglishDate(clock) : "Loading…"}
        </p>
        <p
          className="mt-0.5 text-xs text-muted-foreground/80"
          suppressHydrationWarning
        >
          {hydrated ? formatTimeZoneLabel(clock) : ""}
        </p>
      </div>
    </aside>
  );
}
