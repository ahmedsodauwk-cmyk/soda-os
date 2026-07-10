"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Search,
  Users,
  ShoppingCart,
  Banknote,
} from "lucide-react";

import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getEmptyState,
  getWorkspaceSlogan,
} from "@/lib/brand/soda-voice";
import { formatDate, formatPrice, getInitials } from "@/lib/orders/utils";
import { getProjectsByWorkspace } from "@/lib/projects/repository";
import {
  filterProjects,
  formatRelativeActivity,
  uniqueTeamCount,
} from "@/lib/projects/utils";
import { PROJECT_STATUSES } from "@/lib/projects/types";
import type { WorkspaceSummary } from "@/lib/workspaces/types";

interface WorkspaceDetailContentProps {
  workspace: WorkspaceSummary;
}

export function WorkspaceDetailContent({
  workspace,
}: WorkspaceDetailContentProps) {
  const [projects] = useState(() => getProjectsByWorkspace(workspace.id));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(
    () => filterProjects(projects, search, statusFilter),
    [projects, search, statusFilter]
  );

  const teamCount = uniqueTeamCount(projects);
  const upcomingShoots = projects.flatMap((p) =>
    p.upcomingShoots.map((shoot) => ({
      ...shoot,
      projectName: p.name,
      projectId: p.id,
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/workspaces" />}
            className="-ml-2 h-8 gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="size-3.5" />
            All workspaces
          </Button>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {workspace.label}
            </h2>
            <p
              className="text-xs leading-relaxed text-muted-foreground/80 whitespace-pre-line"
              dir="rtl"
            >
              {getWorkspaceSlogan(workspace.id)}
            </p>
            {workspace.description ? (
              <p className="mt-1 text-xs text-muted-foreground/80">
                {workspace.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="transition-colors hover:bg-muted/30">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {workspace.progress}%
            </p>
            <Progress value={workspace.progress} className="gap-0" />
          </CardContent>
        </Card>

        <Card className="transition-colors hover:bg-muted/30">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Team members
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {teamCount}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:bg-muted/30">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Orders
            </CardTitle>
            <ShoppingCart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {workspace.ordersCount}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:bg-muted/30">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Revenue
            </CardTitle>
            <Banknote className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
              {formatPrice(workspace.revenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {upcomingShoots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4 text-muted-foreground" />
              Upcoming shoots
            </CardTitle>
            <CardDescription
              className="text-xs leading-relaxed text-muted-foreground/80"
              dir="rtl"
            >
              📸 التصويرات الجاية في الـ Workspace ده.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingShoots
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 6)
              .map((shoot) => (
                <div
                  key={shoot.id}
                  className="flex flex-col gap-1 rounded-lg border border-border/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{shoot.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {shoot.projectName} · {shoot.location}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(shoot.date)}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <Card className="transition-colors hover:bg-muted/30">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                if (value) setStatusFilter(value);
              }}
            >
              <SelectTrigger className="h-8 w-full sm:w-40" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {PROJECT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "OnHold" ? "On Hold" : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground sm:text-right">
            {filtered.length} project{filtered.length === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-sm font-medium" dir="rtl">
                {getEmptyState("projects").title}
              </p>
              <p
                className="max-w-sm text-xs leading-relaxed text-muted-foreground"
                dir="rtl"
              >
                {getEmptyState("projects").description}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group block"
            >
              <Card className="transition-colors hover:bg-muted/30">
                <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold tracking-tight">
                        {project.name}
                      </h3>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.clientName} · {project.id} · Last activity{" "}
                      {formatRelativeActivity(project.lastActivity)}
                    </p>
                    <div className="max-w-sm space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-mono tabular-nums text-muted-foreground">
                          {project.progress}%
                        </span>
                      </div>
                      <Progress value={project.progress} className="gap-0" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 lg:justify-end">
                    <div>
                      <p className="text-xs text-muted-foreground">Orders</p>
                      <p className="font-mono text-sm font-semibold tabular-nums">
                        {project.ordersCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-mono text-sm font-semibold tabular-nums">
                        {formatPrice(project.revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Team</p>
                      <AvatarGroup>
                        {project.team.slice(0, 4).map((member) => (
                          <Avatar key={member.id} size="sm">
                            <AvatarFallback>
                              {member.initials || getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </AvatarGroup>
                    </div>
                    {project.upcomingShoots[0] && (
                      <div className="min-w-[140px]">
                        <p className="text-xs text-muted-foreground">
                          Next shoot
                        </p>
                        <p className="truncate text-sm">
                          {formatDate(project.upcomingShoots[0].date)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
