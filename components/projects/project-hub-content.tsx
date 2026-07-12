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
import { AssignCrewDialog } from "@/components/projects/assign-crew-dialog";
import { AssignProjectEquipmentDialog } from "@/components/projects/assign-project-equipment-dialog";
import { CreateDeliveryDialog } from "@/components/projects/create-delivery-dialog";
import { CreateInvoiceDialog } from "@/components/projects/create-invoice-dialog";
import { ProjectWorkflowActions } from "@/components/projects/project-workflow-actions";
import { RecordProjectPaymentDialog } from "@/components/projects/record-project-payment-dialog";
import { UploadProjectFileDialog } from "@/components/projects/upload-project-file-dialog";
import { JourneyStepper } from "@/components/business/journey-stepper";
import { RelatedRecords } from "@/components/navigation/related-records";
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
import {
  getEmptyState,
  getModuleSlogan,
  HUB_SECTION_COPY,
} from "@/lib/brand/soda-voice";
import { getTeamDisplayName } from "@/lib/brand/team-names";
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
import { getProjectOperatingView } from "@/lib/integration";
import {
  assignmentFinalAmount,
  assignmentRemaining,
} from "@/lib/assignments/repository";
import { getPersonById } from "@/lib/people/repository";

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
    value === "Holding" ||
    value === "Confirmed" ||
    value === "Pending" ||
    value === "Scheduled" ||
    value === "Shooting" ||
    value === "Editing" ||
    value === "Completed" ||
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

  const operating = getProjectOperatingView(project.id);
  const ledgerRevenue = operating.finance.revenue;
  const ledgerCost = operating.finance.cost;
  const ledgerProfit = operating.finance.profit;

  const paidFromHub = project.payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.amount, 0);
  const pendingFromHub = project.payments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + p.amount, 0);
  const paidFromPayments = operating.payments
    .filter((p) => p.status === "paid" && p.kind !== "refund")
    .reduce((acc, p) => acc + p.amount, 0);
  const paid = ledgerRevenue > 0 ? ledgerRevenue : Math.max(paidFromHub, paidFromPayments);
  const pending =
    pendingFromHub > 0
      ? pendingFromHub
      : Math.max(0, project.revenue - paid);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/commercial/${project.workspaceId}`} />}
          className="-ml-2 h-8 gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to {workspaceLabel}
        </Button>

        <RelatedRecords
          title="Related records"
          items={[
            ...(project.clientId
              ? [
                  {
                    label: "Client",
                    href: `/clients/${project.clientId}`,
                    detail: project.clientName,
                  },
                ]
              : []),
            ...(project.orders[0]
              ? [
                  {
                    label: "Orders",
                    href: `/orders/${project.orders[0].id}`,
                    detail: `${project.ordersCount} linked`,
                  },
                ]
              : [
                  {
                    label: "Orders",
                    href: "/orders",
                    detail: "No orders yet",
                  },
                ]),
            { label: "Finance", href: "/finance", detail: "Payments" },
            { label: "Calendar", href: "/calendar", detail: "Schedule" },
            { label: "Quotations", href: "/quotations", detail: "Quotes" },
          ]}
        />

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
                <p
                  className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground whitespace-pre-line"
                  dir="rtl"
                >
                  {getModuleSlogan("projectHub")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {project.clientId ? (
                    <Link
                      href={`/clients/${project.clientId}`}
                      className="hover:text-soda-pink hover:underline"
                    >
                      {project.clientName}
                    </Link>
                  ) : (
                    project.clientName
                  )}{" "}
                  · {project.id} · Updated{" "}
                  {formatRelativeActivity(project.lastActivity)}
                </p>
                {project.description && (
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
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
                <ProjectWorkflowActions
                  project={project}
                  orders={project.orders}
                />
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

            <JourneyStepper
              current={project.journeyStage ?? "Inquiry"}
              compact
            />
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
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Revenue", ledgerRevenue > 0 ? ledgerRevenue : project.revenue],
              ["Cost", ledgerCost],
              ["Profit", ledgerProfit],
              [
                "Crew",
                project.team.length > 0
                  ? project.team.length
                  : operating.assignments.length,
              ],
            ].map(([label, value]) => (
              <Card key={label as string}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-lg font-semibold tabular-nums">
                    {label === "Crew"
                      ? String(value)
                      : formatPrice(value as number)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {HUB_SECTION_COPY.overview.title}
              </CardTitle>
              <CardDescription
                className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground"
                dir="rtl"
              >
                {HUB_SECTION_COPY.overview.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Milestones
                </p>
                {project.overview.milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {getEmptyState("activity").title}
                  </p>
                ) : (
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
                )}
              </div>
              <Separator />
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Next action
                </p>
                <p className="text-sm">
                  {project.overview.nextAction || "—"}
                </p>
              </div>
              {project.overview.summary ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {project.overview.summary}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {HUB_SECTION_COPY.upcomingShoots.title}
              </CardTitle>
              <CardDescription
                className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground"
                dir="rtl"
              >
                {HUB_SECTION_COPY.upcomingShoots.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.upcomingShoots.length === 0 ? (
                <div dir="rtl">
                  <p className="text-sm font-medium">
                    {getEmptyState("shoots").title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {getEmptyState("shoots").description}
                  </p>
                </div>
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
        </div>
      )}

      {section === "orders" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {HUB_SECTION_COPY.orders.title}
            </CardTitle>
            <CardDescription
              className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground"
              dir="rtl"
            >
              {HUB_SECTION_COPY.orders.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex flex-col gap-2 rounded-lg border border-border/60 px-3 py-3 transition-colors hover:border-soda-pink/35 sm:flex-row sm:items-center sm:justify-between"
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
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {section === "calendar" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {HUB_SECTION_COPY.calendar.title}
            </CardTitle>
            <CardDescription
              className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground"
              dir="rtl"
            >
              {HUB_SECTION_COPY.calendar.description}
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
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="text-base">
                {HUB_SECTION_COPY.files.title}
              </CardTitle>
              <CardDescription
                className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground"
                dir="rtl"
              >
                {HUB_SECTION_COPY.files.description}
              </CardDescription>
            </div>
            <UploadProjectFileDialog
              projectId={project.id}
              workspaceId={project.workspaceId}
              orders={project.orders}
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {project.files.length === 0 ? (
              <div dir="rtl">
                <p className="text-sm font-medium">
                  {getEmptyState("files").title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {getEmptyState("files").description}
                </p>
              </div>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  Cost (ledger)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  {formatPrice(ledgerCost)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  Profit (ledger)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  {formatPrice(ledgerProfit)}
                </p>
              </CardContent>
            </Card>
          </div>

          {operating.quotations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked quotations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {operating.quotations.map((q) => (
                  <Link
                    key={q.id}
                    href={`/quotations/${q.id}`}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm hover:border-soda-pink/35"
                  >
                    <span>
                      {q.number} · {q.pipelineStage}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatPrice(q.estimatedValue)}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-base">
                  {HUB_SECTION_COPY.payments.title}
                </CardTitle>
                <CardDescription
                  className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground"
                  dir="rtl"
                >
                  {HUB_SECTION_COPY.payments.description}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <CreateInvoiceDialog
                  projectId={project.id}
                  clientId={project.clientId}
                  orders={project.orders}
                />
                <RecordProjectPaymentDialog
                  projectId={project.id}
                  clientId={project.clientId}
                  workspaceId={project.workspaceId}
                  orders={project.orders}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.payments.length === 0 && operating.payments.length === 0 ? (
                <div dir="rtl">
                  <p className="text-sm font-medium">
                    {getEmptyState("payments").title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {getEmptyState("payments").description}
                  </p>
                </div>
              ) : project.payments.length > 0 ? (
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
              ) : (
                operating.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {payment.label ?? payment.kind}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {payment.kind}
                        {payment.paidAt
                          ? ` · Paid ${formatDate(payment.paidAt)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{payment.status}</Badge>
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
            <CardTitle className="text-base">
              {HUB_SECTION_COPY.timeline.title}
            </CardTitle>
            <CardDescription
              className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground"
              dir="rtl"
            >
              {HUB_SECTION_COPY.timeline.description}
            </CardDescription>
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
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="text-base">
                {HUB_SECTION_COPY.team.title}
              </CardTitle>
              <CardDescription
                className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground"
                dir="rtl"
              >
                {HUB_SECTION_COPY.team.description}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <AssignCrewDialog orders={project.orders} />
              <AssignProjectEquipmentDialog />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.team.length === 0 && operating.assignments.length === 0 ? (
              <div className="col-span-full py-4 text-center" dir="rtl">
                <p className="font-ar text-sm font-medium">
                  {getEmptyState("team").title}
                </p>
                <p className="font-ar mt-1 text-xs leading-relaxed text-muted-foreground">
                  {getEmptyState("team").description}
                </p>
              </div>
            ) : project.team.length > 0 ? (
              project.team.map((member) => (
              <Link
                key={member.id}
                href={`/crew/${member.id}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-3 transition-colors hover:border-soda-pink/35"
              >
                <Avatar>
                  <AvatarFallback>
                    {member.initials || getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-ar text-sm font-medium" dir="rtl">
                    {getTeamDisplayName(member.name, member.id)}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </Link>
              ))
            ) : (
              operating.assignments.map((a) => {
                const person = getPersonById(a.personId);
                const name = person?.nameEn ?? a.personId;
                return (
                  <Link
                    key={a.id}
                    href={`/crew/${a.personId}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-3 transition-colors hover:border-soda-pink/35"
                  >
                    <Avatar>
                      <AvatarFallback>
                        {person?.initials || getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.role} · {formatPrice(assignmentFinalAmount(a))}
                        {assignmentRemaining(a) > 0
                          ? ` · due ${formatPrice(assignmentRemaining(a))}`
                          : " · paid"}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {section === "notes" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {HUB_SECTION_COPY.notes.title}
            </CardTitle>
            <CardDescription
              className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground"
              dir="rtl"
            >
              {HUB_SECTION_COPY.notes.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.notes.length === 0 ? (
              <div dir="rtl">
                <p className="text-sm font-medium">
                  {getEmptyState("notes").title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {getEmptyState("notes").description}
                </p>
              </div>
            ) : (
              project.notes.map((note) => (
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
              ))
            )}
          </CardContent>
        </Card>
      )}

      {section === "activity" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {HUB_SECTION_COPY.activity.title}
            </CardTitle>
            <CardDescription
              className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground"
              dir="rtl"
            >
              {HUB_SECTION_COPY.activity.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.activity.length === 0 ? (
              <div dir="rtl">
                <p className="text-sm font-medium">
                  {getEmptyState("activity").title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {getEmptyState("activity").description}
                </p>
              </div>
            ) : (
              project.activity.map((item) => (
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
              ))
            )}
          </CardContent>
        </Card>
      )}

      {section === "deliverables" && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="text-base">
                {HUB_SECTION_COPY.deliverables.title}
              </CardTitle>
              <CardDescription
                className="font-ar text-[0.9375rem] leading-[1.75] text-muted-foreground"
                dir="rtl"
              >
                {HUB_SECTION_COPY.deliverables.description}
              </CardDescription>
            </div>
            <CreateDeliveryDialog
              projectId={project.id}
              clientId={project.clientId}
              orders={project.orders}
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {project.deliverables.length === 0 &&
            operating.deliveries.length === 0 ? (
              <div dir="rtl">
                <p className="text-sm font-medium">
                  {getEmptyState("deliverables").title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {getEmptyState("deliverables").description}
                </p>
              </div>
            ) : project.deliverables.length > 0 ? (
              project.deliverables.map((item) => (
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
              ))
            ) : (
              operating.deliveries.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(item.dueDate)}
                    </p>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
