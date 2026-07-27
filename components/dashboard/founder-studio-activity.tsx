import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { AttentionItem, TeamPerformanceRow } from "@/lib/dashboard/types";

interface FounderStudioActivityProps {
  team: TeamPerformanceRow[];
  attention: AttentionItem[];
  limit?: number;
}

/** Screenful 2 — studio activity feed (team + attention signals, no duplicate order list). */
export function FounderStudioActivity({
  team,
  attention,
  limit = 5,
}: FounderStudioActivityProps) {
  const active = [...team]
    .filter((t) => t.currentWorkload > 0)
    .sort((a, b) => b.currentWorkload - a.currentWorkload)
    .slice(0, 3);

  const signals = attention.slice(0, limit);
  const rows = [
    ...active.map((t) => ({
      id: `team-${t.id}`,
      title: t.name,
      detail: `${t.currentWorkload} active order${t.currentWorkload === 1 ? "" : "s"}`,
      href: `/people/${t.id}`,
    })),
    ...signals.map((a) => ({
      id: a.id,
      title: a.title,
      detail: a.detail,
      href: a.href ?? "/attention",
    })),
  ].slice(0, limit);

  if (rows.length === 0) return null;

  return (
    <Card className="soda-founder-panel soda-cc-card min-w-0">
      <CardHeader className="flex-row items-start justify-between space-y-0 px-3 py-2.5 pb-1.5">
        <SodaSectionHeader
          title="Studio Activity"
          layer="sodaLive"
          as="h2"
          size="card"
        />
        <Link
          href="/attention"
          className="inline-flex items-center gap-1 text-sm font-semibold text-soda-pink hover:underline"
        >
          View All
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="px-3 pb-2.5 pt-0">
        <ul className="divide-y divide-border/40">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className="block rounded-md px-1 py-1.5 transition-colors hover:bg-muted/40"
              >
                <p className="text-[15px] font-semibold leading-snug">
                  {row.title}
                </p>
                <p className="text-sm text-muted-foreground">{row.detail}</p>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
