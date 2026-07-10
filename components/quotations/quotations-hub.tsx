"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  LayoutGrid,
  List,
  Plus,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  getQuotations,
  moveQuotationStage,
  PIPELINE_STAGES,
  type PipelineStage,
  type Quotation,
} from "@/lib/quotations";
import { formatEgp, formatShortDate } from "@/lib/quotations/utils";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "list";

const STAGE_COLORS: Record<PipelineStage, string> = {
  "New Inquiry": "border-sky-500/40",
  Discovery: "border-cyan-500/40",
  Draft: "border-amber-500/40",
  "Internal Review": "border-orange-500/40",
  Sent: "border-violet-500/40",
  "Client Feedback": "border-fuchsia-500/40",
  Revision: "border-rose-500/40",
  Approved: "border-emerald-500/40",
  Rejected: "border-red-500/40",
  "Deposit Received": "border-teal-500/40",
  "Converted to Project": "border-soda-pink/50",
};

function QuotationCard({ q }: { q: Quotation }) {
  return (
    <Link
      href={`/quotations/${q.id}`}
      className="block rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-soda-pink/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-muted-foreground">{q.number}</p>
          <p className="truncate text-sm font-medium">{q.clientName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {q.category}
            {q.company ? ` · ${q.company}` : ""}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {q.probability}%
        </Badge>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="font-mono font-medium">{formatEgp(q.estimatedValue)}</span>
        <span className="text-muted-foreground">{q.assignedSales}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Close {formatShortDate(q.expectedClosingDate)}
      </p>
    </Link>
  );
}

export function QuotationsHub() {
  const [view, setView] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<"all" | "commercial" | "wedding">(
    "all"
  );
  const [tick, setTick] = useState(0);

  const quotations = useMemo(() => {
    void tick;
    let list = getQuotations();
    if (segment !== "all") {
      list = list.filter((q) => q.segment === segment);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) =>
        [
          item.number,
          item.clientName,
          item.company,
          item.contactName,
          item.category,
          item.assignedSales,
          item.pipelineStage,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [search, segment, tick]);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(
      PIPELINE_STAGES.map((s) => [s, [] as Quotation[]])
    ) as Record<PipelineStage, Quotation[]>;
    for (const q of quotations) {
      map[q.pipelineStage]?.push(q);
    }
    return map;
  }, [quotations]);

  function handleMove(id: string, stage: PipelineStage) {
    moveQuotationStage(id, stage);
    setTick((t) => t + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quotations…"
              className="h-8 w-52 pl-8 lg:w-64"
            />
          </div>
          <Select
            value={segment}
            onValueChange={(v) =>
              setSegment((v as "all" | "commercial" | "wedding") ?? "all")
            }
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All segments</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="wedding">Wedding</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-lg border border-border/60 p-0.5">
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 px-2.5"
              onClick={() => setView("kanban")}
            >
              <LayoutGrid className="size-3.5" />
              Kanban
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 px-2.5"
              onClick={() => setView("list")}
            >
              <List className="size-3.5" />
              List
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          nativeButton={false}
          render={<Link href="/quotations/new" />}
        >
          <Plus className="size-4" />
          New quotation
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {quotations.length} quotation{quotations.length === 1 ? "" : "s"} in
        pipeline
      </p>

      {view === "kanban" ? (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-3">
            {PIPELINE_STAGES.map((stage) => (
              <div
                key={stage}
                className={cn(
                  "w-64 shrink-0 rounded-xl border border-t-2 bg-muted/20",
                  STAGE_COLORS[stage]
                )}
              >
                <div className="flex items-center justify-between px-3 py-2.5">
                  <h3 className="text-xs font-semibold tracking-tight">
                    {stage}
                  </h3>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {byStage[stage].length}
                  </Badge>
                </div>
                <div className="space-y-2 px-2 pb-3">
                  {byStage[stage].map((q) => (
                    <div key={q.id} className="space-y-1">
                      <QuotationCard q={q} />
                      {stage !== "Converted to Project" &&
                      stage !== "Rejected" ? (
                        <Select
                          onValueChange={(v) => {
                            if (v) handleMove(q.id, v as PipelineStage);
                          }}
                        >
                          <SelectTrigger className="h-7 text-[11px]">
                            <SelectValue placeholder="Move…" />
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE_STAGES.filter((s) => s !== stage).map(
                              (s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      ) : null}
                    </div>
                  ))}
                  {byStage[stage].length === 0 ? (
                    <p className="px-1 py-4 text-center text-[11px] text-muted-foreground">
                      Empty
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All quotations</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-border/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Number</th>
                  <th className="px-4 py-2.5 font-medium">Client</th>
                  <th className="px-4 py-2.5 font-medium">Segment</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Value</th>
                  <th className="px-4 py-2.5 font-medium">Prob.</th>
                  <th className="px-4 py-2.5 font-medium">Stage</th>
                  <th className="px-4 py-2.5 font-medium">Sales</th>
                  <th className="px-4 py-2.5 font-medium">Close</th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-border/40 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs">{q.number}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{q.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.contactName}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 capitalize">{q.segment}</td>
                    <td className="px-4 py-2.5">{q.category}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {formatEgp(q.estimatedValue)}
                    </td>
                    <td className="px-4 py-2.5">{q.probability}%</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="text-[10px]">
                        {q.pipelineStage}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs">{q.assignedSales}</td>
                    <td className="px-4 py-2.5 text-xs">
                      {formatShortDate(q.expectedClosingDate)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1"
                        nativeButton={false}
                        render={<Link href={`/quotations/${q.id}`} />}
                      >
                        Open
                        {q.pipelineStage === "Converted to Project" ? (
                          <CheckCircle2 className="size-3.5 text-emerald-500" />
                        ) : null}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {quotations.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No quotations match your filters.
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
