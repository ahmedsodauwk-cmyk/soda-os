import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { WorkspacePerformanceRow } from "@/lib/dashboard/types";
import { formatPrice } from "@/lib/orders/utils";

interface WorkspacePerformanceProps {
  workspaces: WorkspacePerformanceRow[];
}

export default function WorkspacePerformance({
  workspaces,
}: WorkspacePerformanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Performance</CardTitle>
        <CardDescription>
          Revenue, pipeline, and progress by production lane
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {workspaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workspaces yet.</p>
        ) : (
          workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.slug}`}
              className="block rounded-lg p-3 transition-colors hover:bg-muted/50"
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
