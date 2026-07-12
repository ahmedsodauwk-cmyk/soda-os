"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  FileText,
  MapPin,
  MessageCircle,
  Users,
  Wallet,
} from "lucide-react";

import { OrderExpenseReportDialog } from "@/components/orders/order-expense-report-dialog";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderEditButton } from "@/components/orders/order-edit-button";
import { OrderStatusControls } from "@/components/orders/order-status-controls";
import { AssignCrewDialog } from "@/components/projects/assign-crew-dialog";
import { BackLink } from "@/components/navigation/back-link";
import { RelatedRecords } from "@/components/navigation/related-records";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  assignmentFinalAmount,
  type OrderAssignment,
} from "@/lib/assignments/types";
import type { CalendarEvent } from "@/lib/calendar/types";
import type { BusinessEvent } from "@/lib/core/types";
import type { EquipmentAssignment } from "@/lib/equipment/types";
import type { FileAsset } from "@/lib/files/types";
import type { Expense } from "@/lib/finance/expenses";
import type { OrderOperatingView } from "@/lib/integration";
import { formatDate, formatPrice } from "@/lib/orders/utils";
import type { Person } from "@/lib/people/types";
import { cn } from "@/lib/utils";

export interface OrderCapabilities {
  canEdit: boolean;
  canEditFinance: boolean;
  canUpdateStatus: boolean;
  crewStatusOnly: boolean;
}

interface OrderCommandCenterProps {
  view: OrderOperatingView;
  peopleById: Record<string, Person>;
  files: FileAsset[];
  equipment: Array<EquipmentAssignment & { name?: string }>;
  calendar: CalendarEvent[];
  activity: BusinessEvent[];
  orderExpenses?: Expense[];
  capabilities?: OrderCapabilities;
}

function personLabel(peopleById: Record<string, Person>, id: string): string {
  const p = peopleById[id];
  if (!p) return id;
  return p.nickname || p.nameEn || p.nameAr;
}

function whatsappHref(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function squadDisplay(
  order: NonNullable<OrderOperatingView["order"]>,
  assignments: OrderAssignment[],
  peopleById: Record<string, Person>
): string {
  if (order.team?.trim()) return order.team.trim();
  if (assignments.length > 0) {
    const names = assignments
      .slice(0, 3)
      .map((a) => personLabel(peopleById, a.personId));
    const extra = assignments.length > 3 ? ` +${assignments.length - 3}` : "";
    return `${names.join(", ")}${extra}`;
  }
  if (order.squadMemberIds?.length) {
    return `${order.squadMemberIds.length} crew assigned`;
  }
  return "No team";
}

export function OrderCommandCenter({
  view,
  peopleById,
  files,
  equipment,
  calendar,
  activity,
  orderExpenses = [],
  capabilities = {
    canEdit: true,
    canEditFinance: true,
    canUpdateStatus: true,
    crewStatusOnly: false,
  },
}: OrderCommandCenterProps) {
  const router = useRouter();
  const order = view.order;
  if (!order) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Order not found
        </CardContent>
      </Card>
    );
  }

  const stubs = [
    {
      id: order.id,
      clientName: order.clientName,
      status: order.status,
      shootDate: order.shootDate,
      price: order.price,
    },
  ];

  const hasCrew =
    view.assignments.length > 0 || (order.squadMemberIds?.length ?? 0) > 0;
  const squadLabel = squadDisplay(order, view.assignments, peopleById);
  const wa = whatsappHref(order.whatsapp || order.phone);
  const showExpenseReport =
    capabilities.canEdit &&
    (order.status === "Editing" ||
      order.status === "Completed" ||
      order.status === "Shooting" ||
      order.status === "Delivered");

  return (
    <div className="space-y-6">
      <BackLink href="/orders" label="Orders" />
      <RelatedRecords
        title="Related records"
        items={[
          ...(order.clientId
            ? [
                {
                  label: "Client",
                  href: `/clients/${order.clientId}`,
                  detail: order.clientName,
                },
              ]
            : []),
          ...(order.projectId
            ? [
                {
                  label: "Project",
                  href: `/projects/${order.projectId}`,
                  detail: order.projectType,
                },
              ]
            : []),
          { label: "Finance", href: "/finance", detail: "Payments" },
          { label: "Calendar", href: "/calendar", detail: order.shootDate },
        ]}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-lg font-semibold tracking-tight">
              {order.id}
            </h2>
            <OrderStatusBadge status={order.status} />
            <Badge variant="outline" className="capitalize">
              {order.priority}
            </Badge>
            {order.packageName ? (
              <Badge variant="secondary">{order.packageName}</Badge>
            ) : null}
            {order.latePenaltyEnabled ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="size-3" />
                Late policy
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {order.clientName} · {order.projectType} · {squadLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {capabilities.canUpdateStatus ? (
            <OrderStatusControls
              order={order}
              crewOnly={capabilities.crewStatusOnly}
            />
          ) : null}
          {capabilities.canEdit ? (
            <>
              <OrderEditButton order={order} />
              <AssignCrewDialog orders={stubs} />
            </>
          ) : null}
          {showExpenseReport ? (
            <OrderExpenseReportDialog
              orderId={order.id}
              orderLabel={order.clientName}
              onSaved={() => router.refresh()}
            />
          ) : null}
          {wa ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              nativeButton={false}
              render={<a href={wa} target="_blank" rel="noopener noreferrer" />}
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Agreed"
          value={formatPrice(view.finance.agreed)}
          hint="Contract — not revenue"
        />
        <Metric
          label="Revenue"
          value={formatPrice(view.finance.collected)}
          hint="Collected only"
        />
        <Metric
          label="Outstanding"
          value={formatPrice(view.finance.outstanding)}
          hint={view.finance.status}
        />
        <Metric
          label="Crew cost"
          value={formatPrice(
            view.assignments.reduce((a, x) => a + assignmentFinalAmount(x), 0)
          )}
        />
        <Metric
          label="Profit"
          value={
            view.finance.profit == null
              ? "—"
              : formatPrice(view.finance.profit)
          }
          hint={
            view.finance.profit == null
              ? "Needs collections + expenses"
              : undefined
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brief</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {order.brief || "No brief yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {order.notes || "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dress Code</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{order.dressCode || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Late Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {order.latePenaltyEnabled ? (
              <>
                <p>{formatPrice(order.latePenaltyAmount)}</p>
                <p className="text-muted-foreground">
                  {order.latePenaltyReason || "No reason noted"}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Not enabled</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-soda-pink" />
              Squad
            </CardTitle>
            <CardDescription>Squad name — never an id</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{squadLabel}</p>
            {hasCrew ? (
              <ul className="space-y-1 text-muted-foreground">
                {view.assignments.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/crew/${a.personId}`}
                      className="hover:text-soda-pink hover:underline"
                    >
                      {personLabel(peopleById, a.personId)}
                    </Link>
                    {" · "}
                    {a.role}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No crew assigned yet</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="size-4 text-soda-pink" />
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wa ? (
              <Button
                type="button"
                className="gap-1.5"
                nativeButton={false}
                render={
                  <a href={wa} target="_blank" rel="noopener noreferrer" />
                }
              >
                <MessageCircle className="size-3.5" />
                Open chat · {order.whatsapp || order.phone}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">No WhatsApp number</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Client">
          {view.client ? (
            <Link
              href={`/clients/${view.client.id}`}
              className="text-soda-pink hover:underline"
            >
              {view.client.name}
            </Link>
          ) : (
            order.clientName
          )}
        </Field>
        <Field label="Project">
          {view.project ? (
            <Link
              href={`/projects/${view.project.id}`}
              className="text-soda-pink hover:underline"
            >
              {view.project.name}
            </Link>
          ) : (
            order.projectId
          )}
        </Field>
        <Field label="Shoot">
          <span className="inline-flex items-center gap-1">
            {formatDate(order.shootDate) || "—"}
          </span>
        </Field>
        <Field label="Location">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
            {order.location || "—"}
          </span>
        </Field>
        <Field label="Delivery">{formatDate(order.deliveryDate) || "—"}</Field>
        <Field label="Package">{order.packageName || "—"}</Field>
        <Field label="Deliverables">
          {(order.deliverables ?? []).join(", ") || "—"}
          {order.reelCount > 0 ? ` · ${order.reelCount} reels` : ""}
        </Field>
        <Field label="Planned expenses">
          {formatPrice(
            (order.plannedExpenses ?? []).reduce(
              (a, l) => a + (Number(l.amount) || 0),
              0
            )
          )}
        </Field>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-soda-pink" />
              Team assignment
            </CardTitle>
            <CardDescription>
              Role, call time, meeting point, expected pay, status
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {view.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No crew assigned yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crew</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Call</TableHead>
                  <TableHead>Meeting</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.assignments.map((a: OrderAssignment) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Link
                        href={`/crew/${a.personId}`}
                        className="hover:text-soda-pink hover:underline"
                      >
                        {personLabel(peopleById, a.personId)}
                      </Link>
                    </TableCell>
                    <TableCell>{a.role}</TableCell>
                    <TableCell>{a.callTime || "—"}</TableCell>
                    <TableCell>{a.meetingPoint || "—"}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatPrice(assignmentFinalAmount(a))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {a.assignmentStatus.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {orderExpenses.length > 0 || showExpenseReport ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order expenses</CardTitle>
            <CardDescription>
              Actual costs linked to this order
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orderExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No expenses logged yet — use Expense Report after the shoot.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {orderExpenses.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <span className="capitalize">{e.category}</span>
                    <span className="font-mono text-xs">
                      {formatPrice(e.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-soda-pink" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calendar.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dated events</p>
            ) : (
              <ul className="space-y-2">
                {calendar.map((ev) => (
                  <li
                    key={ev.id}
                    className="rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(ev.startsAt.slice(0, 10))} · {ev.kind}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="size-4 text-soda-pink" />
              Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No equipment booked on this order
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {equipment.map((eq) => (
                  <li
                    key={eq.id}
                    className="rounded-lg border border-border/60 px-3 py-2"
                  >
                    <p className="font-medium">{eq.name || eq.equipmentId}</p>
                    <p className="text-xs text-muted-foreground">
                      {eq.startsOn || eq.assignedAt}
                      {eq.endsOn ? ` → ${eq.endsOn}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-soda-pink" />
              Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground">No files linked</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <span className="truncate font-medium">{f.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {f.size}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4 text-soda-pink" />
            Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {view.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {view.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                >
                  <span>
                    {p.kind} · {p.status}
                  </span>
                  <span className="font-mono text-xs">
                    {formatPrice(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
          <CardDescription>Activity for this order</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((ev) => (
                <li
                  key={ev.id}
                  className={cn(
                    "rounded-lg border border-border/60 px-3 py-2 text-sm"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{ev.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {ev.occurredAt.slice(0, 16).replace("T", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ev.payload.summary || ev.source}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  href = "/finance",
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  return (
    <Link href={href} className="block cursor-pointer">
      <Card className="transition-colors hover:border-soda-pink/40">
        <CardContent className="pt-5">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 font-mono text-xl font-semibold">{value}</p>
          {hint ? (
            <p className="mt-1 text-xs capitalize text-muted-foreground">{hint}</p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-1 text-sm whitespace-pre-wrap">{children}</div>
    </div>
  );
}
