"use client";

/**
 * Instant greeting strip — paints before dashboard snapshot streams (Phase 06).
 */

import { useEffect, useState } from "react";

import { getHeroGreeting } from "@/lib/dashboard/hero-summary";

export function HomeGreetingFirst({
  operatorName,
}: {
  operatorName?: string | null;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const greeting = now
    ? getHeroGreeting(now, operatorName)
    : operatorName
      ? `أهلاً ${operatorName}`
      : "أهلاً";

  return (
    <div className="mb-1">
      <p className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {greeting}
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">
        SODA VISUALS · Command Center
      </p>
    </div>
  );
}
