"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getRotatingSummaryMs,
  type RotatingSummaryPanel,
} from "@/lib/dashboard/rotating-summaries";

interface RotatingSummaryProps {
  panels: RotatingSummaryPanel[];
}

/**
 * One Command Center slot that crossfades between real business summaries.
 * Interval 15–20s; fixed min-height to avoid layout shift.
 */
export default function RotatingSummary({ panels }: RotatingSummaryProps) {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (panels.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % panels.length);
      setTick((t) => t + 1);
    }, getRotatingSummaryMs());
    return () => window.clearInterval(id);
  }, [panels.length]);

  const panel = panels[index] ?? panels[0];
  if (!panel) return null;

  return (
    <Card className="soda-cc-card min-h-[14rem]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle
              key={`title-${panel.key}-${tick}`}
              className="soda-live-fade-enter"
            >
              {panel.title}
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              {panel.description}
            </CardDescription>
          </div>
          {panels.length > 1 ? (
            <span className="font-mono text-[10px] text-muted-foreground">
              {index + 1}/{panels.length}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="min-h-[8rem]">
        <dl
          key={`${panel.key}-${tick}`}
          className="soda-live-fade-enter grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        >
          {panel.lines.map((line) => (
            <div
              key={`${panel.key}-${line.label}-${line.value}`}
              className="rounded-xl border border-border/60 bg-background/40 px-3.5 py-3"
            >
              <dt className="text-[11px] tracking-wide text-muted-foreground">
                {line.label}
              </dt>
              <dd className="mt-1 text-sm font-medium leading-snug text-foreground">
                {line.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
