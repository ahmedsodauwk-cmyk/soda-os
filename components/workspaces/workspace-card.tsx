import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  FolderKanban,
  Radio,
  Heart,
  Shirt,
  Package,
  CalendarDays,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPrice } from "@/lib/orders/utils";
import { formatRelativeActivity } from "@/lib/projects/utils";
import type { WorkspaceSummary } from "@/lib/workspaces/types";

const iconMap = {
  radio: Radio,
  heart: Heart,
  shirt: Shirt,
  package: Package,
  calendar: CalendarDays,
  briefcase: Briefcase,
} as const;

interface WorkspaceCardProps {
  workspace: WorkspaceSummary;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const Icon =
    (workspace.icon && iconMap[workspace.icon as keyof typeof iconMap]) ||
    FolderKanban;

  return (
    <Link href={`/commercial/${workspace.slug}`} className="group block">
      <Card className="h-full transition-colors hover:bg-muted/30">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="flex items-start gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted"
              style={
                workspace.color
                  ? { boxShadow: `inset 0 0 0 1px ${workspace.color}33` }
                  : undefined
              }
            >
              <Icon
                className="size-4"
                style={workspace.color ? { color: workspace.color } : undefined}
              />
            </div>
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2">
                <span className="truncate">{workspace.label}</span>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {workspace.description ?? "SODA VISUALS production lane"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Projects</p>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {workspace.projectCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orders</p>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {workspace.ordersCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="font-mono text-sm font-semibold tabular-nums">
                {formatPrice(workspace.revenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last activity</p>
              <p className="flex items-center gap-1 text-sm">
                <Calendar className="size-3 text-muted-foreground" />
                {formatRelativeActivity(workspace.lastActivity)}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {workspace.progress}%
              </span>
            </div>
            <Progress value={workspace.progress} className="gap-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
