"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  Flag,
  MapPin,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEmptyState } from "@/lib/brand/soda-voice";
import type { CrewScheduleConflict } from "@/lib/calendar/conflicts";
import type { CalendarEvent } from "@/lib/calendar/types";
import { formatDate } from "@/lib/orders/utils";
import { cn } from "@/lib/utils";

type ViewMode = "company" | "crew" | "project";
type RangeMode = "daily" | "weekly" | "monthly";

interface CalendarContentProps {
  events: CalendarEvent[];
  asOf: string;
  conflicts: CrewScheduleConflict[];
  peopleOptions: Array<{ id: string; label: string }>;
  projectOptions: Array<{ id: string; label: string }>;
  /** personId → order ids assigned */
  crewOrderMap: Record<string, string[]>;
}

function kindIcon(kind: CalendarEvent["kind"]) {
  if (kind === "shoot") return Camera;
  if (kind === "delivery") return Truck;
  return Flag;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function monthEnd(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d.toISOString().slice(0, 10);
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

export function CalendarContent({
  events,
  asOf,
  conflicts,
  peopleOptions,
  projectOptions,
  crewOrderMap,
}: CalendarContentProps) {
  const [view, setView] = useState<ViewMode>("company");
  const [range, setRange] = useState<RangeMode>("weekly");
  const [personId, setPersonId] = useState("all");
  const [projectId, setProjectId] = useState("all");

  const conflictOrderIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of conflicts) {
      for (const id of c.orderIds) set.add(id);
    }
    return set;
  }, [conflicts]);

  const rangeEnd = useMemo(() => {
    if (range === "daily") return asOf;
    if (range === "weekly") return addDays(asOf, 6);
    return monthEnd(asOf);
  }, [asOf, range]);

  const filtered = useMemo(() => {
    let list = events.filter((e) => {
      const day = e.startsAt.slice(0, 10);
      return day >= asOf && day <= rangeEnd;
    });
    if (view === "project" && projectId !== "all") {
      list = list.filter((e) => e.projectId === projectId);
    }
    if (view === "crew" && personId !== "all") {
      const orderIds = new Set(crewOrderMap[personId] ?? []);
      list = list.filter((e) => e.orderId != null && orderIds.has(e.orderId));
    }
    return list;
  }, [events, asOf, rangeEnd, view, projectId, personId, crewOrderMap]);

  const byDay = groupByDay(filtered);

  return (
    <div className="space-y-6">
      <Card className="soda-cc-card">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-4 text-soda-pink" />
                Studio calendar
              </CardTitle>
              <CardDescription>
                Company / crew / project · daily / weekly / monthly · as of{" "}
                {asOf}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["company", "crew", "project"] as ViewMode[]).map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant={view === v ? "default" : "outline"}
                  className="capitalize"
                  onClick={() => setView(v)}
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["daily", "weekly", "monthly"] as RangeMode[]).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "secondary" : "ghost"}
                className="capitalize"
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
            {view === "crew" ? (
              <Select value={personId} onValueChange={(v) => v && setPersonId(v)}>
                <SelectTrigger className="h-8 w-48">
                  <SelectValue placeholder="Crew member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All crew (company)</SelectItem>
                  {peopleOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {view === "project" ? (
              <Select
                value={projectId}
                onValueChange={(v) => v && setProjectId(v)}
              >
                <SelectTrigger className="h-8 w-56">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projectOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
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
                      const href = ev.orderId
                        ? `/orders/${ev.orderId}`
                        : ev.projectId
                          ? `/projects/${ev.projectId}?section=calendar`
                          : undefined;
                      const conflict =
                        ev.orderId != null &&
                        conflictOrderIds.has(ev.orderId);
                      const row = (
                        <div
                          className={cn(
                            "flex flex-col gap-2 rounded-xl border border-border/60 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between",
                            href && "transition-colors hover:border-soda-pink/35",
                            conflict && "border-destructive/40 bg-destructive/5"
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
                          <div className="flex items-center gap-2">
                            {conflict ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="size-3" />
                                Conflict
                              </Badge>
                            ) : null}
                            <Badge variant="outline" className="capitalize">
                              {ev.kind}
                            </Badge>
                          </div>
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

      {conflicts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-destructive" />
              Crew conflicts
            </CardTitle>
            <CardDescription>
              Same crew member on overlapping shoot dates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {conflicts.map((c) => (
              <div
                key={`${c.personId}-${c.date}`}
                className="rounded-lg border border-destructive/30 px-3 py-2 text-sm"
              >
                <p className="font-medium">
                  {c.personName} · {formatDate(c.date)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.titles.join(" · ")}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {c.orderIds.map((id) => (
                    <Link
                      key={id}
                      href={`/orders/${id}`}
                      className="text-xs text-soda-pink hover:underline"
                    >
                      {id}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
