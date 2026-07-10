"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Banknote,
  GitBranch,
  Users,
  StickyNote,
  Activity,
  PackageCheck,
  ShoppingCart,
  LayoutDashboard,
} from "lucide-react";

import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getEmptyState, getModuleSlogan } from "@/lib/brand/soda-voice";
import { cn } from "@/lib/utils";
import { formatDate, formatPrice, getInitials } from "@/lib/orders/utils";
import type { OrderStatus } from "@/lib/orders/types";
import {
  PROJECT_HUB_SECTIONS,
  type Project,
  type ProjectHubSection,
} from "@/lib/projects/types";
import { formatRelativeActivity } from "@/lib/projects/utils";
import { getWorkspaceDisplayLabel } from "@/lib/workspaces/repository";
import { getWorkspaceById } from "@/lib/taxonomy/repository";

const sectionMeta: Record<
  ProjectHubSection,
  { label: string; icon: typeof LayoutDashboard }
> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  orders: { label: "Orders", icon: ShoppingCart },
  calendar: { label: "Calendar", icon: Calendar },
  files: { label: "Files", icon: FileText },
  payments: { label: "Payments", icon: Banknote },
  timeline: { label: "Timeline", icon: GitBranch },
  team: { label: "Assigned Team", icon: Users },
  notes: { label: "Notes", icon: StickyNote },
  activity: { label: "Activity", icon: Activity },
  deliverables: { label: "Deliverables", icon: PackageCheck },
};

function isOrderStatus(value: string): value is OrderStatus {
  return (
    value === "Pending" ||
    value === "Scheduled" ||
    value === "Shooting" ||
    value === "Editing" ||
    value === "Delivered" ||
    value === "Cancelled"
  );
}

function deliverableLabel(status: string) {
  switch (status) {
    case "delivered":
      return "Delivered";
    case "in_progress":
      return "In progress";
    default:
      return "Pending";
  }
}

interface ProjectHubContentProps {
  project: Project;
}

export function ProjectHubContent({ project }: ProjectHubContentProps) {
  const [section, setSection] = useState<ProjectHubSection>("overview");
  const workspace = getWorkspaceById(project.workspaceId);
  const workspaceLabel = workspace
    ? getWorkspaceDisplayLabel(workspace.id, workspace.label)
    : project.workspaceId;

  const paid = project.payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.amount, 0);
  const pending = project.payments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/workspaces/${project.workspaceId}`} />}
          className="-ml-2 h-8 gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to {workspaceLabel}
        </Button>

        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {project.name}
                  </h2>
                  <ProjectStatusBadge status={project.status} />
                  <Badge variant="outline">{workspaceLabel}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getModuleSlogan("projectHub")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {project.clientName} · {project.id} · Updated{" "}
                  {formatRelativeActivity(project.lastActivity)}
                </p>
                {project.description && (
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 sm:min-w-[280px]">
                <div>
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="font-mono text-lg font-semibold tabular-nums">
                    {project.ordersCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="font-mono text-lg font-semibold tabular-nums">
                    {formatPrice(project.revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team</p>
                  <p className="font-mono text-lg font-semibold tabular-nums">
                    {project.team.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {project.progress}%
                </span>
              </div>
              <Progress value={project.progress} className="gap-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {PROJECT_HUB_SECTIONS.map((key) => {
          const meta = sectionMeta[key];
          const Icon = meta.icon;
          const active = section === key;

          return (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => setSection(key)}
              className={cn(
                "h-8 shrink-0 gap-1.5 rounded-md px-3 font-normal",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {meta.label}
            </Button>
          );
        })}
      </div>

      {section === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
              <CardDescription>{project.overview.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Milestones
                </p>
                <ul className="space-y-2">
                  {project.overview.milestones.map((item) => (
                    <li
                      key={item}
                      className="rounded-lg border border-border/60 px-3 py-2 text-sm"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Next action
                </p>
                <p className="text-sm">{project.overview.nextAction}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming shoots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.upcomingShoots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {getEmptyState("shoots").title}
                </p>
              ) : (
                project.upcomingShoots.map((shoot) => (
                  <div
                    key={shoot.id}
                    className="rounded-lg border border-border/60 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium">{shoot.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(shoot.date)} · {shoot.location}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {section === "orders" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders</CardTitle>
            <CardDescription>
              Bookings linked to this project (mock stubs)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-2 rounded-lg border border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-sm font-medium">{order.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.clientName} · {formatDate(order.shootDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isOrderStatus(order.status) ? (
                    <OrderStatusBadge status={order.status} />
                  ) : (
                    <Badge variant="outline">{order.status}</Badge>
                  )}
                  <p className="font-mono text-sm tabular-nums">
                    {formatPrice(order.price)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {section === "calendar" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calendar</CardTitle>
            <CardDescription>
              Shoots, deliveries, and milestones for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.calendar.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-1 rounded-lg border border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.location ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {event.kind}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.startsAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {section === "files" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files</CardTitle>
            <CardDescription>Project assets and documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.files.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {getEmptyState("files").title}
              </p>
            ) : (
              project.files.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col gap-1 rounded-lg border border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.type} · {file.size}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeActivity(file.updatedAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {section === "payments" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  {formatPrice(paid)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  {formatPrice(pending)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {getEmptyState("payments").title}
                </p>
              ) : (
                project.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{payment.label}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {payment.kind}
                        {payment.paidAt
                          ? ` · Paid ${formatDate(payment.paidAt)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={
                          payment.status === "paid"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                        }
                      >
                        {payment.status}
                      </Badge>
                      <p className="font-mono text-sm tabular-nums">
                        {formatPrice(payment.amount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {section === "timeline" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
            <CardDescription>Key project events</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border/60 pl-4">
              {project.timeline.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[21px] mt-1.5 size-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.date)} · {event.type}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {section === "team" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assigned Team</CardTitle>
            <CardDescription>
              Crew currently assigned to this project
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.team.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-3"
              >
                <Avatar>
                  <AvatarFallback>
                    {member.initials || getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {section === "notes" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-border/60 px-3 py-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{note.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeActivity(note.createdAt)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{note.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {section === "activity" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.activity.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 rounded-lg border border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{item.actor}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeActivity(item.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {section === "deliverables" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.deliverables.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDate(item.dueDate)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    item.status === "delivered"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : item.status === "in_progress"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                        : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
                  }
                >
                  {deliverableLabel(item.status)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
