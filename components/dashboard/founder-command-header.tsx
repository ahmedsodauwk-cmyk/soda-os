"use client";

import { FounderHero } from "@/components/dashboard/founder-hero";
import type { DashboardVoiceInput } from "@/lib/brand/types";

interface FounderCommandHeaderProps {
  dashboard: DashboardVoiceInput;
  operatorName?: string | null;
}

/** Founder greeting + rotating operational brief (SODA MOTION V3). */
export function FounderCommandHeader(props: FounderCommandHeaderProps) {
  return <FounderHero {...props} />;
}
