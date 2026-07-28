import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { buildActivityFeed } from "@/lib/dashboard/activity-feed";

interface FounderCompanyUpdatesProps {
  limit?: number;
}

/** Compact company activity feed — replaces Studio Activity panel. */
export function FounderCompanyUpdates({ limit = 5 }: FounderCompanyUpdatesProps) {
  const rows = buildActivityFeed({ includePayments: true }).slice(0, limit);

  return (
    <Card className="soda-founder-panel soda-cc-card min-w-0 h-full">
      <CardHeader className="flex-row items-start justify-between space-y-0 px-3 py-2.5 pb-1.5">
        <SodaSectionHeader
          title="Latest Updates"
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
        {rows.length === 0 ? (
          <p className="rounded-lg border border-border/50 bg-muted/20 px-3 py-3 text-center text-[15px] text-muted-foreground">
            No company updates yet today.
          </p>
        ) : (
        <ul className="divide-y divide-border/40">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href ?? "/attention"}
                className="flex items-start gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {row.timeLabel}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug">
                    {row.category}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {row.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        )}
      </CardContent>
    </Card>
  );
}
