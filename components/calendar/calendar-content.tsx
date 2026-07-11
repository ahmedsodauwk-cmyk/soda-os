import Link from "next/link";
import { CalendarDays, Camera, Flag, MapPin, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEmptyState } from "@/lib/brand/soda-voice";
import type { CalendarEvent } from "@/lib/calendar/types";
import { formatDate } from "@/lib/orders/utils";
import { cn } from "@/lib/utils";

interface CalendarContentProps {
  events: CalendarEvent[];
  asOf: string;
}

function kindIcon(kind: CalendarEvent["kind"]) {
  if (kind === "shoot") return Camera;
  if (kind === "delivery") return Truck;
  return Flag;
}

function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const day = ev.startsAt.slice(0, 10);
    const list = map.get(day) ?? [];
    list.push(ev);
    map.set(day, list);
  }
  return map;
}

export function CalendarContent({ events, asOf }: CalendarContentProps) {
  const upcoming = events.filter((e) => e.startsAt.slice(0, 10) >= asOf);
  const past = events.filter((e) => e.startsAt.slice(0, 10) < asOf).slice(-12);
  const byDay = groupByDay(upcoming);

  return (
    <div className="space-y-6">
      <Card className="soda-cc-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-soda-pink" />
            Studio calendar
          </CardTitle>
          <CardDescription>
            Shoots, deliveries, and project milestones from live orders and
            projects · as of {asOf}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 px-6 py-10 text-center">
              <p className="text-sm font-medium">
                {getEmptyState("shoots").title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Schedule appears when orders have shoot or delivery dates.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {[...byDay.entries()].map(([day, dayEvents]) => (
                <div key={day}>
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {day === asOf ? "Today" : formatDate(day)}
                  </p>
                  <ul className="space-y-2">
                    {dayEvents.map((ev) => {
                      const Icon = kindIcon(ev.kind);
                      const href = ev.projectId
                        ? `/projects/${ev.projectId}?section=calendar`
                        : undefined;
                      const row = (
                        <div
                          className={cn(
                            "flex flex-col gap-2 rounded-xl border border-border/60 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between",
                            href && "transition-colors hover:border-soda-pink/35"
                          )}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="soda-kpi-icon mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                              <Icon className="size-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {ev.title}
                              </p>
                              {ev.location ? (
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="size-3 shrink-0" />
                                  <span className="truncate">{ev.location}</span>
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <Badge variant="outline" className="w-fit capitalize">
                            {ev.kind}
                          </Badge>
                        </div>
                      );
                      return (
                        <li key={ev.id}>
                          {href ? <Link href={href}>{row}</Link> : row}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {past.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-base font-semibold">Recent past</h2>
          <ul className="space-y-2">
            {past
              .slice()
              .reverse()
              .map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/40 px-3.5 py-2.5 opacity-80"
                >
                  <div>
                    <p className="text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(ev.startsAt.slice(0, 10))}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {ev.kind}
                  </Badge>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
