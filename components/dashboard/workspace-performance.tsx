import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DASHBOARD_SECTION_COPY,
  getEmptyState,
} from "@/lib/brand/soda-voice";
import type { WorkspacePerformanceRow } from "@/lib/dashboard/types";
import { formatPrice } from "@/lib/orders/utils";

interface WorkspacePerformanceProps {
  workspaces: WorkspacePerformanceRow[];
}

export default function WorkspacePerformance({
  workspaces,
}: WorkspacePerformanceProps) {
  return (
    <Card className="soda-cc-card">
      <CardHeader>
        <CardTitle>{DASHBOARD_SECTION_COPY.workspaces.title}</CardTitle>
        <CardDescription
          className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
          dir="rtl"
        >
          {DASHBOARD_SECTION_COPY.workspaces.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {workspaces.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm font-medium">
              {getEmptyState("workspaces").title}
            </p>
          </div>
        ) : (
          workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/commercial/${ws.slug}`}
              className="block cursor-pointer rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: ws.color ?? "var(--muted-foreground)",
                      }}
                    />
                    <p className="truncate text-sm font-medium">{ws.label}</p>
                  </div>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                  {formatPrice(ws.revenue)}
                </p>
              </div>

              <div className="mb-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>
                  <span className="font-mono text-foreground">
                    {ws.activeProjects}
                  </span>{" "}
                  projects
                </span>
                <span>
                  <span className="font-mono text-foreground">{ws.orders}</span>{" "}
                  orders
                </span>
                <span className="text-right">
                  <span className="font-mono text-foreground">
                    {ws.progress}%
                  </span>{" "}
                  progress
                </span>
              </div>

              <Progress value={ws.progress} className="gap-0" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
