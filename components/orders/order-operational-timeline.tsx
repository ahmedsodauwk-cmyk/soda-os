"use client";

import {
  CalendarDays,
  Camera,
  CircleDot,
  ClipboardList,
  FileText,
  Package,
  Sparkles,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type {
  TimelineIconKey,
  TimelineItem,
  TimelineTone,
} from "@/lib/orders/timeline";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<TimelineIconKey, LucideIcon> = {
  order: ClipboardList,
  status: CircleDot,
  calendar: CalendarDays,
  crew: Users,
  payment: Wallet,
  delivery: Package,
  equipment: Camera,
  file: FileText,
  expense: Wallet,
  activity: Sparkles,
};

const TONE_DOT: Record<TimelineTone, string> = {
  neutral:
    "border-zinc-400/50 bg-zinc-400/15 text-zinc-500 dark:border-zinc-500/40 dark:bg-zinc-500/20 dark:text-zinc-300",
  info: "border-sky-500/45 bg-sky-500/15 text-sky-600 dark:text-sky-300",
  brand:
    "border-soda-pink/50 bg-gradient-to-br from-soda-pink/20 via-soda-purple/15 to-soda-purple-deep/10 text-soda-pink",
  success:
    "border-emerald-500/45 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning:
    "border-amber-500/45 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  danger:
    "border-red-500/45 bg-red-500/15 text-red-600 dark:text-red-300",
};

const TONE_RAIL: Record<TimelineTone, string> = {
  neutral: "bg-zinc-400/40 dark:bg-zinc-500/35",
  info: "bg-sky-500/50",
  brand: "bg-gradient-to-b from-soda-pink via-soda-purple to-soda-purple-deep",
  success: "bg-emerald-500/55",
  warning: "bg-amber-500/55",
  danger: "bg-red-500/55",
};

function formatTimelineDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatTimelineTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  // Date-only field anchors use midday UTC — no meaningful clock time
  if (/^\d{4}-\d{2}-\d{2}T12:00:00(\.000)?Z$/.test(iso)) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

interface OrderOperationalTimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function OrderOperationalTimeline({
  items,
  className,
}: OrderOperationalTimelineProps) {
  return (
    <section
      className={cn(
        "soda-cc-card relative overflow-hidden rounded-xl border border-soda-pink/20",
        "bg-gradient-to-br from-white via-soda-pink/[0.03] to-soda-purple/[0.06]",
        "dark:from-soda-purple-deep/40 dark:via-card dark:to-soda-purple/20",
        "shadow-[0_0_28px_color-mix(in_oklch,var(--soda-pink)_8%,transparent)]",
        className
      )}
      aria-label="Operational timeline"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-soda-pink/50 to-transparent"
        aria-hidden
      />
      <div className="border-b border-border/50 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-lg",
                  "bg-gradient-to-br from-soda-pink/20 to-soda-purple/25 text-soda-pink"
                )}
              >
                <Sparkles className="size-4" aria-hidden />
              </span>
              <h3 className="text-base font-semibold tracking-tight">
                Operational Timeline
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Chronological story of this order — recorded events only
            </p>
          </div>
          <span className="rounded-md border border-soda-pink/25 bg-soda-pink/5 px-2.5 py-1 text-xs font-medium text-soda-pink tabular-nums">
            {items.length} {items.length === 1 ? "event" : "events"}
          </span>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
            <p className="text-sm font-medium">No timeline events yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Shoot dates, crew, payments, and activity will appear here when
              recorded — nothing is invented.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-0">
            {items.map((item, index) => (
              <TimelineRow
                key={item.id}
                item={item}
                isLast={index === items.length - 1}
              />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function TimelineRow({
  item,
  isLast,
}: {
  item: TimelineItem;
  isLast: boolean;
}) {
  const Icon = ICON_MAP[item.icon] ?? CircleDot;
  const dateLabel = formatTimelineDate(item.occurredAt);
  const timeLabel = formatTimelineTime(item.occurredAt);

  return (
    <li className="relative flex gap-3 sm:gap-4">
      <div className="flex w-[4.5rem] shrink-0 flex-col items-end pt-0.5 sm:w-[5.25rem]">
        <time
          dateTime={item.occurredAt}
          className="text-right text-[11px] font-medium tracking-wide text-foreground/80 sm:text-xs"
        >
          {dateLabel}
        </time>
        <span className="mt-0.5 font-mono text-[10px] text-muted-foreground tabular-nums sm:text-[11px]">
          {timeLabel}
        </span>
      </div>

      <div className="relative flex w-9 shrink-0 flex-col items-center">
        <span
          className={cn(
            "relative z-[1] inline-flex size-8 items-center justify-center rounded-full border",
            TONE_DOT[item.tone]
          )}
          aria-hidden
        >
          <Icon className="size-3.5" />
        </span>
        {!isLast ? (
          <span
            className={cn(
              "absolute top-8 bottom-0 w-0.5 rounded-full",
              TONE_RAIL[item.tone]
            )}
            aria-hidden
          />
        ) : null}
      </div>

      <div
        className={cn(
          "mb-5 min-w-0 flex-1 rounded-lg border border-border/60 bg-card/70 px-3.5 py-3",
          "dark:bg-card/40",
          "transition-colors hover:border-soda-pink/30",
          isLast && "mb-0"
        )}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h4 className="text-sm font-semibold tracking-tight">{item.title}</h4>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <UserRound className="size-3 shrink-0 opacity-70" aria-hidden />
            <span className="max-w-[10rem] truncate">{item.personLabel}</span>
          </span>
        </div>
        {item.description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
            {item.description}
          </p>
        ) : null}
      </div>
    </li>
  );
}
