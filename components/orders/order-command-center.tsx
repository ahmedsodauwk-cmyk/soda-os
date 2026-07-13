"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import { OrderExpenseReportDialog } from "@/components/orders/order-expense-report-dialog";
import { OrderOperationalTimeline } from "@/components/orders/order-operational-timeline";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderEditButton } from "@/components/orders/order-edit-button";
import { OrderStatusControls } from "@/components/orders/order-status-controls";
import { RecordOrderPaymentDialog } from "@/components/orders/record-order-payment-dialog";
import { AssignCrewDialog } from "@/components/projects/assign-crew-dialog";
import { BackLink } from "@/components/navigation/back-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  assignmentFinalAmount,
  assignmentRemaining,
  type OrderAssignment,
} from "@/lib/assignments/types";
import type { CalendarEvent } from "@/lib/calendar/types";
import type { BusinessEvent } from "@/lib/core/types";
import { getBusinessToday } from "@/lib/business/types";
import type { EquipmentAssignment } from "@/lib/equipment/types";
import type { FileAsset } from "@/lib/files/types";
import type { Expense } from "@/lib/finance/expenses";
import type { OrderOperatingView } from "@/lib/integration";
import {
  generateDoNowActions,
  generateNeedsDecision,
  generateWhatsNext,
  type DoNowDestination,
  type WorkspaceCapabilities,
} from "@/lib/orders/do-now";
import { deriveFinancialAssistantPrompt } from "@/lib/orders/financial-assistant";
import { buildOrderTimeline } from "@/lib/orders/timeline";
import { formatDate, formatPrice } from "@/lib/orders/utils";
import {
  deriveOrderHealth,
  orderLane,
  type OrderHealthLevel,
} from "@/lib/orders/workspace-health";
import type { Person } from "@/lib/people/types";
import { cn } from "@/lib/utils";

export interface OrderCapabilities {
  canEdit: boolean;
  canEditFinance: boolean;
  canUpdateStatus: boolean;
  crewStatusOnly: boolean;
  canCollectPayment?: boolean;
  canAddExpense?: boolean;
  canSeeFullMoney?: boolean;
  canAssignCrew?: boolean;
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

function scrollToSection(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function destinationToSection(dest: DoNowDestination): string {
  switch (dest) {
    case "money":
      return "ws-money";
    case "crew":
      return "ws-crew";
    case "deliverables":
      return "ws-deliverables";
    case "files":
      return "ws-files";
    case "status":
    case "identity":
      return "ws-identity";
    default:
      return "ws-command";
  }
}

const HEALTH_STYLES: Record<
  OrderHealthLevel,
  { ring: string; glow: string; text: string }
> = {
  healthy: {
    ring: "border-emerald-500/35 bg-emerald-500/10",
    glow: "from-emerald-500/20 via-transparent to-transparent",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  watch: {
    ring: "border-amber-500/40 bg-amber-500/10",
    glow: "from-amber-500/20 via-transparent to-transparent",
    text: "text-amber-800 dark:text-amber-300",
  },
  at_risk: {
    ring: "border-orange-500/45 bg-orange-500/10",
    glow: "from-orange-500/25 via-transparent to-transparent",
    text: "text-orange-800 dark:text-orange-300",
  },
  critical: {
    ring: "border-red-500/45 bg-red-500/10",
    glow: "from-red-500/25 via-soda-pink/10 to-transparent",
    text: "text-red-700 dark:text-red-300",
  },
};

export function OrderCommandCenter({
  view,
  peopleById,
  files,
  equipment,
  calendar,
  activity,
  orderExpenses = [],
  capabilities: capsIn = {
    canEdit: true,
    canEditFinance: true,
    canUpdateStatus: true,
    crewStatusOnly: false,
  },
}: OrderCommandCenterProps) {
  const router = useRouter();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const order = view.order;

  const timelineItems = useMemo(
    () =>
      order
        ? buildOrderTimeline({
            order,
            assignments: view.assignments,
            payments: view.payments,
            deliveries: view.deliveries,
            calendar,
            activity,
            equipment,
            files,
            expenses: orderExpenses,
            peopleById,
          })
        : [],
    [
      order,
      view.assignments,
      view.payments,
      view.deliveries,
      calendar,
      activity,
      equipment,
      files,
      orderExpenses,
      peopleById,
    ]
  );

  if (!order) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/40 px-6 py-12 text-center text-sm text-muted-foreground">
        Order not found
      </div>
    );
  }

  const capabilities: WorkspaceCapabilities = {
    canEdit: capsIn.canEdit,
    canEditFinance: capsIn.canEditFinance,
    canUpdateStatus: capsIn.canUpdateStatus,
    crewStatusOnly: capsIn.crewStatusOnly,
    canCollectPayment:
      capsIn.canCollectPayment ??
      (Boolean(capsIn.canEditFinance) || capsIn.canSeeFullMoney === true),
    canAddExpense: capsIn.canAddExpense ?? capsIn.canEdit,
    canSeeFullMoney: capsIn.canSeeFullMoney ?? capsIn.canEditFinance,
    canAssignCrew: capsIn.canAssignCrew ?? capsIn.canEdit,
  };

  const stubs = [
    {
      id: order.id,
      clientName: order.clientName,
      status: order.status,
      shootDate: order.shootDate,
      price: order.price,
    },
  ];

  const asOf = getBusinessToday();
  const lane = orderLane(order.projectType);
  const wa = whatsappHref(order.whatsapp || order.phone);

  const health = deriveOrderHealth({
    order,
    finance: view.finance,
    assignments: view.assignments,
    deliveries: view.deliveries,
    expenseCount: orderExpenses.filter((e) => e.status === "posted").length,
    fileCount: files.length,
    asOf,
  });

  const doNowInput = {
    order,
    finance: {
      outstanding: view.finance.outstanding,
      collected: view.finance.collected,
      agreed: view.finance.agreed,
    },
    assignments: view.assignments,
    deliveries: view.deliveries,
    payments: view.payments,
    expenseCount: orderExpenses.filter((e) => e.status === "posted").length,
    fileCount: files.length,
    asOf,
    capabilities,
  };

  const doNow = generateDoNowActions(doNowInput);
  const decisions = generateNeedsDecision(doNowInput);
  const whatsNext = generateWhatsNext(doNowInput);
  const moneyPrompt = deriveFinancialAssistantPrompt({
    order,
    finance: view.finance,
    payments: view.payments,
    assignments: view.assignments,
    expenses: orderExpenses,
    asOf,
    canSeeMoneyPrompts: capabilities.canSeeFullMoney,
  });

  const healthStyle = HEALTH_STYLES[health.level];
  const showExpense =
    capabilities.canAddExpense &&
    (order.status === "Editing" ||
      order.status === "Completed" ||
      order.status === "Shooting" ||
      order.status === "Delivered" ||
      order.status === "Scheduled");

  const pendingDeliverables = view.deliveries.filter(
    (d) => d.status === "pending" || d.status === "in_progress"
  );
  const checklist =
    pendingDeliverables.length > 0
      ? pendingDeliverables.map((d) => ({
          id: d.id,
          label: d.label,
          due: d.dueDate,
          status: d.status,
        }))
      : (order.deliverables ?? []).map((label, i) => ({
          id: `dl-${i}`,
          label,
          due: order.deliveryDate,
          status:
            order.status === "Delivered" || order.status === "Completed"
              ? "delivered"
              : "pending",
        }));

  function runDoNow(actionId: string, destination: DoNowDestination) {
    if (actionId === "collect_payment" || actionId === "record_payment_method") {
      setPaymentOpen(true);
      scrollToSection("ws-money");
      return;
    }
    if (actionId === "add_expense") {
      setExpenseOpen(true);
      scrollToSection("ws-money");
      return;
    }
    scrollToSection(destinationToSection(destination));
  }

  return (
    <div className="relative space-y-8 pb-10">
      {/* Atmosphere — control room, not form wallpaper */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-72 rounded-[2rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-soda-purple/25 via-soda-pink/10 to-transparent dark:from-soda-purple/40 dark:via-soda-pink/15"
      />

      <div className="relative space-y-8">
        <BackLink href="/orders" label="Orders" />

        {/* ── A · Identity strip ── */}
        <section
          id="ws-identity"
          className="overflow-hidden rounded-2xl border border-soda-purple/25 bg-gradient-to-br from-soda-purple/[0.12] via-card/80 to-soda-pink/[0.08] p-5 shadow-[0_0_40px_-20px_rgba(41,25,74,0.55)] dark:border-soda-purple/35 dark:from-soda-purple/30 dark:via-card/40 dark:to-soda-pink/10"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">
                  {order.id}
                </h1>
                <Badge
                  variant="outline"
                  className="border-soda-pink/40 bg-soda-pink/10 text-soda-pink"
                >
                  {lane}
                </Badge>
                <OrderStatusBadge status={order.status} />
                {order.packageName ? (
                  <Badge variant="secondary">{order.packageName}</Badge>
                ) : null}
              </div>
              <p className="text-base font-medium text-foreground">
                {order.clientName}
                <span className="text-muted-foreground">
                  {" "}
                  · {order.projectType}
                </span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-soda-pink" />
                  Shoot {formatDate(order.shootDate) || "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-soda-pink" />
                  {order.location || "Location TBD"}
                </span>
              </div>
              <p className={cn("text-sm font-medium", healthStyle.text)}>
                {health.label}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  — {health.reason}
                </span>
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
              {wa ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  nativeButton={false}
                  render={
                    <a href={wa} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <MessageCircle className="size-3.5" />
                  WhatsApp
                </Button>
              ) : null}
            </div>
          </div>

          {/* Quiet depth links */}
          <div className="mt-4 flex flex-wrap gap-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
            {order.clientId ? (
              <Link
                href={`/clients/${order.clientId}`}
                className="hover:text-soda-pink"
              >
                Client
              </Link>
            ) : null}
            {order.projectId ? (
              <Link
                href={`/projects/${order.projectId}`}
                className="hover:text-soda-pink"
              >
                Project
              </Link>
            ) : null}
            {capabilities.canSeeFullMoney ? (
              <Link href="/finance" className="hover:text-soda-pink">
                Finance depth
              </Link>
            ) : null}
            <Link href="/calendar" className="hover:text-soda-pink">
              Calendar
            </Link>
          </div>
        </section>

        {/* ── B · COMMAND ── */}
        <section id="ws-command" className="space-y-3">
          <SectionLabel>Command</SectionLabel>
          <div className="grid gap-3 lg:grid-cols-3">
            {/* Health */}
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border p-4",
                healthStyle.ring
              )}
            >
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-br",
                  healthStyle.glow
                )}
              />
              <div className="relative space-y-2">
                <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Order health
                </p>
                <p className={cn("text-lg font-semibold", healthStyle.text)}>
                  {health.label}
                </p>
                <p className="text-sm text-muted-foreground">{health.reason}</p>
              </div>
            </div>

            {/* Needs Decision */}
            <div className="rounded-2xl border border-soda-purple/25 bg-card/60 p-4 dark:bg-card/30">
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Needs decision
              </p>
              {decisions.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing waiting on you — decision queue clear.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {decisions.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() =>
                          scrollToSection(destinationToSection(d.destination))
                        }
                        className="flex w-full items-start gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-left transition-colors hover:border-soda-pink/40"
                      >
                        <span
                          className={cn(
                            "mt-1 size-1.5 shrink-0 rounded-full",
                            d.severity === "critical" && "bg-red-500",
                            d.severity === "warning" && "bg-amber-500",
                            d.severity === "info" && "bg-sky-500"
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {d.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {d.detail}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Do Now */}
            <div className="rounded-2xl border border-soda-pink/30 bg-gradient-to-br from-soda-pink/[0.08] via-card/70 to-soda-purple/[0.1] p-4">
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Do now
              </p>
              {doNow.length === 0 ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Nothing required on this job right now.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {doNow.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => runDoNow(a.id, a.destination)}
                        className="group flex w-full items-center justify-between gap-2 rounded-xl border border-soda-pink/25 bg-background/50 px-3 py-2.5 text-left transition-all hover:border-soda-pink/50 hover:bg-soda-pink/10"
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="h-5 border-soda-purple/40 px-1.5 font-mono text-[10px]"
                            >
                              {a.priority}
                            </Badge>
                            <span className="text-sm font-semibold">
                              {a.label}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {a.reason}
                          </span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-soda-pink opacity-70 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ── C · WORK ── */}
        <section className="space-y-3">
          <SectionLabel>Work</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Money */}
            <article
              id="ws-money"
              className="scroll-mt-24 rounded-2xl border border-border/60 bg-card/50 p-5 dark:bg-card/25"
            >
              <header className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Wallet className="size-4 text-soda-pink" />
                    Money
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Agreed · Collected · Outstanding — not revenue vibes
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {capabilities.canCollectPayment ? (
                    <RecordOrderPaymentDialog
                      order={order}
                      defaultAmount={
                        view.finance.outstanding > 0
                          ? view.finance.outstanding
                          : undefined
                      }
                      open={paymentOpen}
                      onOpenChange={setPaymentOpen}
                      onRecorded={() => router.refresh()}
                    />
                  ) : null}
                  {showExpense ? (
                    <OrderExpenseReportDialog
                      orderId={order.id}
                      orderLabel={order.clientName}
                      open={expenseOpen}
                      onOpenChange={setExpenseOpen}
                      onSaved={() => router.refresh()}
                    />
                  ) : null}
                </div>
              </header>

              {capabilities.canSeeFullMoney ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <MoneyStat
                      label="Agreed"
                      value={formatPrice(view.finance.agreed)}
                    />
                    <MoneyStat
                      label="Collected"
                      value={formatPrice(view.finance.collected)}
                    />
                    <MoneyStat
                      label="Outstanding"
                      value={formatPrice(view.finance.outstanding)}
                      emphasize={view.finance.outstanding > 0}
                    />
                  </div>
                  {!moneyPrompt.silent && moneyPrompt.question ? (
                    <div className="mt-4 rounded-xl border border-soda-purple/30 bg-gradient-to-r from-soda-purple/10 to-soda-pink/5 px-3 py-3">
                      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-soda-pink uppercase">
                        <Sparkles className="size-3" />
                        Financial assistant
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {moneyPrompt.question}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {moneyPrompt.detail}
                      </p>
                    </div>
                  ) : moneyPrompt.detail ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {moneyPrompt.detail}
                    </p>
                  ) : null}

                  {view.payments.length > 0 ? (
                    <ul className="mt-4 space-y-1.5">
                      {view.payments.slice(0, 5).map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-2.5 py-1.5 text-xs"
                        >
                          <span className="capitalize text-muted-foreground">
                            {p.kind}
                            {p.method ? ` · ${p.method}` : ""} · {p.status}
                          </span>
                          <span className="font-mono">
                            {formatPrice(p.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {orderExpenses.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        Expenses on this order
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {orderExpenses.map((e) => (
                          <li
                            key={e.id}
                            className="flex justify-between text-xs"
                          >
                            <span className="capitalize">{e.category}</span>
                            <span className="font-mono">
                              {formatPrice(e.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {view.finance.profit != null ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Profit signal:{" "}
                      <span className="font-mono text-foreground">
                        {formatPrice(view.finance.profit)}
                      </span>
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Full commercial money is restricted for your role.
                </p>
              )}
            </article>

            {/* Crew */}
            <article
              id="ws-crew"
              className="scroll-mt-24 rounded-2xl border border-border/60 bg-card/50 p-5 dark:bg-card/25"
            >
              <header className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Users className="size-4 text-soda-pink" />
                    Crew
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Who is on this job · confirm · pay posture
                  </p>
                </div>
                {capabilities.canAssignCrew ? (
                  <AssignCrewDialog orders={stubs} />
                ) : null}
              </header>
              {view.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No crew assigned yet
                  {order.team?.trim() ? ` · squad note: ${order.team}` : ""}
                </p>
              ) : (
                <ul className="space-y-2">
                  {view.assignments.map((a: OrderAssignment) => {
                    const remaining = assignmentRemaining(a);
                    return (
                      <li
                        key={a.id}
                        className="rounded-xl border border-border/50 px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Link
                            href={`/crew/${a.personId}`}
                            className="font-medium hover:text-soda-pink hover:underline"
                          >
                            {personLabel(peopleById, a.personId)}
                          </Link>
                          <Badge
                            variant="outline"
                            className="capitalize"
                          >
                            {a.assignmentStatus.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {a.role}
                          {a.callTime ? ` · call ${a.callTime}` : ""}
                          {a.meetingPoint ? ` · ${a.meetingPoint}` : ""}
                        </p>
                        {capabilities.canSeeFullMoney ||
                        capabilities.canCollectPayment ? (
                          <p className="mt-1 font-mono text-xs">
                            {assignmentFinalAmount(a) > 0 ? (
                              <>
                                {formatPrice(assignmentFinalAmount(a))}
                                {remaining > 0 ? (
                                  <span className="text-amber-600 dark:text-amber-400">
                                    {" "}
                                    · owed {formatPrice(remaining)}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    {" "}
                                    · paid
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground">
                                Rate not set
                              </span>
                            )}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>

            {/* Deliverables */}
            <article
              id="ws-deliverables"
              className="scroll-mt-24 rounded-2xl border border-border/60 bg-card/50 p-5 dark:bg-card/25"
            >
              <header className="mb-4">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Package className="size-4 text-soda-pink" />
                  Deliverables
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Due {formatDate(order.deliveryDate) || "—"}
                  {order.reelCount > 0 ? ` · ${order.reelCount} reels` : ""}
                </p>
              </header>
              {checklist.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No deliverables listed yet
                  {capabilities.canEdit
                    ? " — set them when you edit the order."
                    : "."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {checklist.map((item) => {
                    const overdue =
                      item.due &&
                      item.due < asOf &&
                      item.status !== "delivered" &&
                      item.status !== "accepted";
                    return (
                      <li
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm",
                          overdue
                            ? "border-red-500/35 bg-red-500/5"
                            : "border-border/50"
                        )}
                      >
                        <span>{item.label}</span>
                        <span
                          className={cn(
                            "text-xs capitalize",
                            overdue
                              ? "font-medium text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          )}
                        >
                          {overdue ? "overdue" : item.status.replace("_", " ")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>

            {/* Files */}
            <article
              id="ws-files"
              className="scroll-mt-24 rounded-2xl border border-border/60 bg-card/50 p-5 dark:bg-card/25"
            >
              <header className="mb-4">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <FileText className="size-4 text-soda-pink" />
                  Files
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Briefs, selects, finals that belong to this order
                </p>
              </header>
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No files linked yet
                </p>
              ) : (
                <ul className="space-y-2">
                  {files.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm"
                    >
                      <span className="truncate font-medium">{f.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {f.size}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {equipment.length > 0 ? (
                <div className="mt-4 border-t border-border/40 pt-3">
                  <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    Equipment on order
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                    {equipment.map((eq) => (
                      <li key={eq.id}>{eq.name || eq.equipmentId}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          </div>
        </section>

        {/* ── D · STORY ── */}
        <section className="space-y-3">
          <SectionLabel>Story</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <article className="rounded-2xl border border-border/60 bg-card/50 p-5 dark:bg-card/25">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <CalendarDays className="size-4 text-soda-pink" />
                What&apos;s next
              </h2>
              {whatsNext.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No upcoming beats on the calendar for this order.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {whatsNext.map((item) => (
                    <li
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm",
                        item.tone === "danger" &&
                          "border-red-500/35 bg-red-500/5",
                        item.tone === "warning" &&
                          "border-amber-500/35 bg-amber-500/5",
                        item.tone === "success" &&
                          "border-emerald-500/35 bg-emerald-500/5",
                        item.tone === "neutral" && "border-border/50"
                      )}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.when}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {(order.brief || order.notes || order.dressCode) && (
                <div className="mt-4 space-y-2 border-t border-border/40 pt-3 text-sm">
                  {order.brief ? (
                    <div>
                      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        Brief
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                        {order.brief}
                      </p>
                    </div>
                  ) : null}
                  {order.dressCode ? (
                    <p className="text-xs text-muted-foreground">
                      Dress code:{" "}
                      <span className="text-foreground">{order.dressCode}</span>
                    </p>
                  ) : null}
                </div>
              )}
            </article>

            <div className="min-w-0">
              <OrderOperationalTimeline items={timelineItems} />
            </div>
          </div>
        </section>

        {order.latePenaltyEnabled ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="size-3.5 text-amber-500" />
            Late policy on · {formatPrice(order.latePenaltyAmount)}
            {order.latePenaltyReason ? ` — ${order.latePenaltyReason}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="bg-gradient-to-r from-soda-pink to-soda-purple bg-clip-text text-[11px] font-semibold tracking-[0.18em] text-transparent uppercase">
      {children}
    </p>
  );
}

function MoneyStat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-2.5 py-2",
        emphasize
          ? "border-soda-pink/40 bg-soda-pink/10"
          : "border-border/50 bg-background/40"
      )}
    >
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-semibold",
          emphasize && "text-soda-pink"
        )}
      >
        {value}
      </p>
    </div>
  );
}
