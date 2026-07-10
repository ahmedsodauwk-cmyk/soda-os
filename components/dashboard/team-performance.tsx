import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DASHBOARD_SECTION_COPY,
  getEmptyState,
} from "@/lib/brand/soda-voice";
import type { TeamPerformanceRow } from "@/lib/dashboard/types";

interface TeamPerformanceProps {
  team: TeamPerformanceRow[];
  limit?: number;
}

export default function TeamPerformance({
  team,
  limit = 8,
}: TeamPerformanceProps) {
  const rows = team.slice(0, limit);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{DASHBOARD_SECTION_COPY.team.title}</CardTitle>
        <CardDescription
          className="text-xs leading-relaxed text-muted-foreground/80"
          dir="rtl"
        >
          {DASHBOARD_SECTION_COPY.team.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <div className="py-4 text-center" dir="rtl">
            <p className="text-sm font-medium">
              {getEmptyState("team").title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {getEmptyState("team").description}
            </p>
          </div>
        ) : (
          rows.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-4 font-mono text-xs text-muted-foreground">
                  {index + 1}
                </span>
                <Avatar size="sm">
                  <AvatarFallback className="text-xs">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.role}
                  </p>
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-3 gap-3 text-right text-xs">
                <div>
                  <p className="text-muted-foreground">Projects</p>
                  <p className="font-mono font-medium tabular-nums">
                    {member.projectsAssigned}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Done</p>
                  <p className="font-mono font-medium tabular-nums">
                    {member.ordersCompleted}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Load</p>
                  <p className="font-mono font-medium tabular-nums">
                    {member.currentWorkload}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
