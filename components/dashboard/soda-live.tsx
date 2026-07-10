"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Clapperboard,
  FileUp,
  GitBranch,
  Package,
  Truck,
  UserPlus,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DASHBOARD_SECTION_COPY } from "@/lib/brand";
import {
  getActivityFeedRotateMs,
  type ActivityFeedEvent,
  type ActivityFeedKind,
} from "@/lib/dashboard/activity-feed";
import { cn } from "@/lib/utils";

interface SodaLiveFeedProps {
  events: ActivityFeedEvent[];
  className?: string;
}

const kindIcon: Record<ActivityFeedKind, typeof Camera> = {
  order: Package,
  payment: Wallet,
  delivery: Truck,
  shoot: Camera,
  journey: GitBranch,
  file: FileUp,
  assignment: UserPlus,
  status: Clapperboard,
};

/**
 * SODA LIVE — chronological activity feed from real business events.
 * Auto-rotates every ~10s; pauses on hover; fixed min-height to avoid layout shift.
 */
export default function SodaLiveFeed({ events, className }: SodaLiveFeedProps) {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (events.length <= 1) return;
    const id = window.setInterval(() => {
      if (paused.current) return;
      setIndex((i) => (i + 1) % events.length);
      setTick((t) => t + 1);
    }, getActivityFeedRotateMs());
    return () => window.clearInterval(id);
  }, [events.length]);

  const event = events[index] ?? events[0];
  if (!event) return null;

  const Icon = kindIcon[event.kind];
  const copy = DASHBOARD_SECTION_COPY.sodaLive;

  const body = (
    <div
      key={`${event.id}-${tick}`}
      className="soda-live-fade-enter flex items-start gap-3"
    >
      <div className="soda-kpi-icon-pink flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {event.timeLabel}
          </span>
          <Badge
            variant="outline"
            className="border-soda-pink/25 bg-soda-pink/8 text-[10px] font-medium tracking-wide text-soda-pink"
          >
            {event.category}
          </Badge>
        </div>
        <p className="text-sm leading-snug font-medium text-foreground sm:text-[0.9375rem]">
          {event.description}
        </p>
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
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
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
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              {copy.description}
            </CardDescription>
          </div>
          {events.length > 1 ? (
            <Badge
              variant="outline"
              className="border-soda-pink/30 bg-soda-pink/10 font-mono text-[10px] text-soda-pink"
            >
              {index + 1}/{events.length}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="min-h-[5.5rem]">
        {event.href ? (
          <Link
            href={event.href}
            className="block transition-opacity hover:opacity-90"
          >
            {body}
          </Link>
        ) : (
          body
        )}
      </CardContent>
    </Card>
  );
}
