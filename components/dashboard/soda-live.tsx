"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Clapperboard,
  Quote,
  Sparkles,
  Trophy,
  Truck,
  Wallet,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DASHBOARD_SECTION_COPY,
  getSodaLiveRotateMs,
} from "@/lib/brand";
import type { SodaLiveItem, SodaLiveKind } from "@/lib/brand/types";
import { cn } from "@/lib/utils";

interface SodaLiveCardProps {
  items: SodaLiveItem[];
  className?: string;
}

const kindIcon: Record<SodaLiveKind, typeof Sparkles> = {
  delivery: Truck,
  payment: Wallet,
  workspace: Workflow,
  shoot: Camera,
  achievement: Trophy,
  milestone: Sparkles,
  quote: Quote,
  activity: Clapperboard,
};

/**
 * SODA LIVE — one dynamic awareness card.
 * Rotates every ~17s with crossfade; never critical ops.
 */
export default function SodaLiveCard({ items, className }: SodaLiveCardProps) {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
      setTick((t) => t + 1);
    }, getSodaLiveRotateMs());
    return () => window.clearInterval(id);
  }, [items.length]);

  const item = items[index] ?? items[0];
  if (!item) return null;

  const Icon = kindIcon[item.kind];
  const copy = DASHBOARD_SECTION_COPY.sodaLive;

  const body = (
    <div
      key={`${item.id}-${tick}`}
      className="soda-live-fade-enter space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="soda-kpi-icon-pink flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] font-medium tracking-[0.14em] text-soda-pink uppercase">
            {item.eyebrow}
          </p>
          <p className="font-heading text-base font-semibold leading-snug tracking-tight">
            {item.title}
          </p>
          <p
            className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
            dir="rtl"
          >
            {item.body}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Card
      className={cn(
        "soda-cc-card relative overflow-hidden border-soda-pink/20",
        "bg-[linear-gradient(145deg,color-mix(in_oklch,var(--soda-pink)_10%,transparent)_0%,var(--card)_55%)]",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-soda-pink opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-soda-pink" />
              </span>
              {copy.title}
            </CardTitle>
            <CardDescription
              className="font-ar mt-1 text-[0.9375rem] leading-[1.8] text-muted-foreground"
              dir="rtl"
            >
              {copy.description}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="border-soda-pink/30 bg-soda-pink/10 font-mono text-[10px] text-soda-pink"
          >
            {index + 1}/{items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {item.href ? (
          <Link href={item.href} className="block transition-opacity hover:opacity-90">
            {body}
          </Link>
        ) : (
          body
        )}
      </CardContent>
    </Card>
  );
}
