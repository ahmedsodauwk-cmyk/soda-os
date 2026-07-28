"use client";

import { SodaLanguage } from "@/components/brand/soda-language";
import {
  buildHeroOperationalLines,
  getHeroGreeting,
} from "@/lib/dashboard/hero-summary";
import type { DashboardVoiceInput } from "@/lib/brand/types";

interface FounderCommandHeaderProps {
  dashboard: DashboardVoiceInput;
  operatorName?: string | null;
}

/** Founder greeting — Arabic anchor + operational lines only (no clock, no actions). */
export function FounderCommandHeader({
  dashboard,
  operatorName,
}: FounderCommandHeaderProps) {
  const greeting = getHeroGreeting(new Date(), operatorName);
  const lines = buildHeroOperationalLines(dashboard);
  const summary = lines[0]?.text ?? null;

  return (
    <header
      aria-labelledby="founder-command-greeting"
      className="soda-founder-header min-w-0 flex-1 space-y-1"
    >
      <h1
        id="founder-command-greeting"
        lang="ar"
        dir="rtl"
        className="soda-founder-greeting font-ar min-w-0 font-bold leading-tight tracking-tight text-foreground"
      >
        {greeting}
      </h1>
      {summary ? (
        <SodaLanguage size="header" className="max-w-2xl">
          {summary}
        </SodaLanguage>
      ) : null}
    </header>
  );
}
