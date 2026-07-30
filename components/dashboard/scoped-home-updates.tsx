import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HomePanelCard } from "@/components/dashboard/home-panel-card";
import { buildActivityFeed } from "@/lib/dashboard/activity-feed";
import { activityFeedScopeFromDataScope } from "@/lib/dashboard/home-registry";
import type { DataScope } from "@/lib/identity/data-scope";

interface ScopedHomeUpdatesProps {
  scope: DataScope;
  limit?: number;
}

/** Permission-scoped activity feed — no company finance signals for non-Founder. */
export function ScopedHomeUpdates({ scope, limit = 5 }: ScopedHomeUpdatesProps) {
  const feedScope = activityFeedScopeFromDataScope(scope);
  const rows = buildActivityFeed(feedScope).slice(0, limit);

  const title =
    scope.accessLevel === "team"
      ? "My Updates"
      : scope.accessLevel === "team_leader"
        ? "Team Updates"
        : "My Updates";

  return (
    <HomePanelCard
      title={title}
      layer="sodaLive"
      viewAllHref="/notifications"
      viewAllLabel="View All"
      isEmpty={rows.length === 0}
      emptyMessage="No updates in your scope yet today."
    >
      <ul className="divide-y divide-border/40">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={row.href ?? "/notifications"}
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
              <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </HomePanelCard>
  );
}
