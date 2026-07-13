/**
 * SODA Brain (internal) — Do Now + Needs Decision + What's Next generators.
 * Called only via evaluateOrderOperationalTruth — do not import from UI.
 * Pure: observe loaded order state → emit actions → filter by capabilities.
 */

import {
  assignmentRemaining,
  type OrderAssignment,
} from "@/lib/assignments/types";
import type { OrderDelivery } from "@/lib/invoices/types";
import {
  isOrderActiveWorkload,
  isOrderCompleted,
  isOrderHolding,
  isOrderOperational,
} from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";
import type { Payment } from "@/lib/payments/types";

export type DoNowPriority = "P0" | "P1" | "P2" | "P3" | "P4";

export type DoNowDestination =
  | "money"
  | "crew"
  | "deliverables"
  | "files"
  | "status"
  | "identity";

export type DoNowActionId =
  | "collect_payment"
  | "record_payment_method"
  | "add_expense"
  | "pay_freelancer"
  | "assign_crew"
  | "confirm_crew"
  | "review_deliverables"
  | "set_delivery_date"
  | "upload_files"
  | "advance_status";

export interface DoNowAction {
  id: DoNowActionId;
  label: string;
  reason: string;
  priority: DoNowPriority;
  destination: DoNowDestination;
  /** Condition that retires this action when false */
  expiryHint: string;
}

export interface NeedsDecisionItem {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info";
  destination: DoNowDestination;
}

export interface WorkspaceCapabilities {
  canEdit: boolean;
  canEditFinance: boolean;
  canUpdateStatus: boolean;
  crewStatusOnly: boolean;
  /** Record client payment / method */
  canCollectPayment: boolean;
  /** Add expense on order */
  canAddExpense: boolean;
  /** See full commercial money */
  canSeeFullMoney: boolean;
  /** Assign / manage crew */
  canAssignCrew: boolean;
}

export interface DoNowInput {
  order: Order;
  finance: {
    outstanding: number;
    collected: number;
    agreed: number;
  };
  assignments: OrderAssignment[];
  deliveries: OrderDelivery[];
  payments: Payment[];
  expenseCount: number;
  fileCount: number;
  asOf: string;
  capabilities: WorkspaceCapabilities;
}

const PRIORITY_RANK: Record<DoNowPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
};

function daysUntil(date: string, asOf: string): number | null {
  if (!date) return null;
  const a = Date.parse(`${asOf}T12:00:00`);
  const b = Date.parse(`${date}T12:00:00`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

function hasCrew(order: Order, assignments: OrderAssignment[]): boolean {
  return (
    assignments.length > 0 ||
    (order.squadMemberIds?.length ?? 0) > 0 ||
    Boolean(order.team?.trim())
  );
}

function deliveryOverdue(
  order: Order,
  deliveries: OrderDelivery[],
  asOf: string
): boolean {
  if (
    isOrderActiveWorkload(order.status) &&
    order.deliveryDate &&
    order.deliveryDate < asOf
  ) {
    return true;
  }
  return deliveries.some(
    (d) =>
      (d.status === "pending" || d.status === "in_progress") &&
      d.dueDate < asOf
  );
}

function deliverySoon(
  order: Order,
  deliveries: OrderDelivery[],
  asOf: string,
  withinDays = 7
): boolean {
  if (
    isOrderActiveWorkload(order.status) &&
    order.deliveryDate &&
    order.deliveryDate >= asOf
  ) {
    const d = daysUntil(order.deliveryDate, asOf);
    if (d != null && d <= withinDays) return true;
  }
  return deliveries.some((d) => {
    if (d.status === "delivered" || d.status === "accepted") return false;
    const dDays = daysUntil(d.dueDate, asOf);
    return dDays != null && dDays >= 0 && dDays <= withinDays;
  });
}

function pendingDeliverables(
  order: Order,
  deliveries: OrderDelivery[]
): string[] {
  const fromDeliveries = deliveries
    .filter((d) => d.status === "pending" || d.status === "in_progress")
    .map((d) => d.label);
  if (fromDeliveries.length > 0) return fromDeliveries;
  if (
    !isOrderCompleted(order.status) &&
    (order.deliverables?.length ?? 0) > 0
  ) {
    return [...(order.deliverables ?? [])];
  }
  return [];
}

/** Generate candidate Do Now actions from live triggers (pre-permission filter). */
export function generateDoNowCandidates(input: DoNowInput): DoNowAction[] {
  const {
    order,
    finance,
    assignments,
    deliveries,
    payments,
    expenseCount,
    fileCount,
    asOf,
  } = input;
  const actions: DoNowAction[] = [];
  const shootIn = daysUntil(order.shootDate, asOf);
  const shootSoon = shootIn != null && shootIn >= 0 && shootIn <= 2;
  const overdueMoney =
    finance.outstanding > 0.009 &&
    Boolean(
      (order.deliveryDate || order.shootDate) &&
        (order.deliveryDate || order.shootDate)! < asOf
    );

  if (order.status === "Cancelled") return [];

  if (finance.outstanding > 0.009) {
    actions.push({
      id: "collect_payment",
      label:
        finance.outstanding > 0
          ? `Collect ${finance.outstanding.toLocaleString("en-EG")} EGP`
          : "Collect payment",
      reason: overdueMoney
        ? "Outstanding balance is past due on this order."
        : "Client money still missing on this order.",
      priority: overdueMoney || shootSoon ? "P0" : "P1",
      destination: "money",
      expiryHint: "outstanding returns to 0",
    });
  }

  const paidMissingMethod = payments.filter(
    (p) => p.status === "paid" && p.kind !== "refund" && !p.method
  );
  if (paidMissingMethod.length > 0) {
    actions.push({
      id: "record_payment_method",
      label: "Record payment method",
      reason: "A collection exists without cash-path (method) truth.",
      priority: "P3",
      destination: "money",
      expiryHint: "method set on payment",
    });
  }

  const postShoot =
    order.status === "Shooting" ||
    order.status === "Editing" ||
    isOrderCompleted(order.status);
  if (postShoot && expenseCount === 0) {
    actions.push({
      id: "add_expense",
      label: "Add expense",
      reason: "Production advanced — costs may still be off-book.",
      priority: "P3",
      destination: "money",
      expiryHint: "expense recorded on order",
    });
  }

  const unpaidCrew = assignments.filter(
    (a) =>
      (a.assignmentStatus === "completed" ||
        a.assignmentStatus === "checked_in" ||
        isOrderCompleted(order.status)) &&
      assignmentRemaining(a) > 0
  );
  if (unpaidCrew.length > 0) {
    actions.push({
      id: "pay_freelancer",
      label: `Pay freelancer (${unpaidCrew.length})`,
      reason: "Crew earnings remaining on this job.",
      priority: "P2",
      destination: "crew",
      expiryHint: "assignment remaining pay = 0",
    });
  }

  if (
    isOrderOperational(order.status) &&
    !hasCrew(order, assignments) &&
    !isOrderCompleted(order.status)
  ) {
    actions.push({
      id: "assign_crew",
      label: "Assign crew",
      reason: shootSoon
        ? "Shoot is soon and nobody is staffed."
        : "Active order with no crew assigned.",
      priority: shootSoon ? "P0" : "P1",
      destination: "crew",
      expiryHint: "at least one assignment exists",
    });
  }

  const awaitingConfirm = assignments.filter(
    (a) => a.assignmentStatus === "assigned"
  );
  if (awaitingConfirm.length > 0 && isOrderOperational(order.status)) {
    actions.push({
      id: "confirm_crew",
      label: `Confirm crew (${awaitingConfirm.length})`,
      reason: shootSoon
        ? "Names on paper — shoot ≤ 48h without confirm."
        : "Assignments still awaiting confirm.",
      priority: shootSoon ? "P0" : "P1",
      destination: "crew",
      expiryHint: "assignments confirmed or removed",
    });
  }

  if (deliveryOverdue(order, deliveries, asOf)) {
    actions.push({
      id: "review_deliverables",
      label: "Review overdue delivery",
      reason: "Client promise is past due.",
      priority: "P0",
      destination: "deliverables",
      expiryHint: "delivery completed or date reset",
    });
  } else if (deliverySoon(order, deliveries, asOf)) {
    actions.push({
      id: "review_deliverables",
      label: "Review deliverables",
      reason: "Deadline soon with work still open.",
      priority: "P1",
      destination: "deliverables",
      expiryHint: "delivery completed or plan honest",
    });
  }

  if (
    isOrderOperational(order.status) &&
    !order.deliveryDate &&
    !isOrderCompleted(order.status)
  ) {
    actions.push({
      id: "set_delivery_date",
      label: "Set delivery date",
      reason: "No finish line — silent failure risk later.",
      priority: "P2",
      destination: "deliverables",
      expiryHint: "delivery date set",
    });
  }

  if (
    isOrderOperational(order.status) &&
    fileCount === 0 &&
    !isOrderCompleted(order.status) &&
    (shootIn == null || shootIn <= 7)
  ) {
    actions.push({
      id: "upload_files",
      label: "Upload brief / files",
      reason: "Active order with no linked files — crew may fly blind.",
      priority: shootSoon ? "P1" : "P2",
      destination: "files",
      expiryHint: "at least one file linked",
    });
  }

  if (
    order.shootDate &&
    order.shootDate < asOf &&
    (order.status === "Scheduled" || order.status === "Confirmed")
  ) {
    actions.push({
      id: "advance_status",
      label: "Advance status",
      reason: "Shoot date passed while status still pre-shoot.",
      priority: "P2",
      destination: "status",
      expiryHint: "status matches reality",
    });
  }

  if (isOrderHolding(order.status) && finance.collected > 0) {
    actions.push({
      id: "advance_status",
      label: "Confirm order",
      reason: "Money in while order still holding/pending.",
      priority: "P2",
      destination: "status",
      expiryHint: "order confirmed into pipeline",
    });
  }

  return actions;
}

function allowedForCapabilities(
  action: DoNowAction,
  caps: WorkspaceCapabilities
): boolean {
  switch (action.id) {
    case "collect_payment":
    case "record_payment_method":
      return caps.canCollectPayment;
    case "add_expense":
      return caps.canAddExpense;
    case "pay_freelancer":
      return caps.canCollectPayment || caps.canSeeFullMoney;
    case "assign_crew":
    case "confirm_crew":
      return caps.canAssignCrew;
    case "review_deliverables":
    case "set_delivery_date":
      return caps.canEdit || caps.canUpdateStatus;
    case "upload_files":
      return caps.canEdit;
    case "advance_status":
      return caps.canUpdateStatus;
    default:
      return false;
  }
}

/** Permission-filtered, priority-sorted short queue (max 3). */
export function generateDoNowActions(
  input: DoNowInput,
  maxVisible = 3
): DoNowAction[] {
  return generateDoNowCandidates(input)
    .filter((a) => allowedForCapabilities(a, input.capabilities))
    .sort(
      (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    )
    .slice(0, maxVisible);
}

/** Decision debt queue — conditions waiting on studio judgment. */
export function generateNeedsDecision(input: DoNowInput): NeedsDecisionItem[] {
  const { order, finance, assignments, deliveries, asOf, capabilities } =
    input;
  const items: NeedsDecisionItem[] = [];
  const shootIn = daysUntil(order.shootDate, asOf);

  if (order.status === "Cancelled") return [];

  if (capabilities.canSeeFullMoney && finance.outstanding > 0.009) {
    const overdue =
      (order.deliveryDate || order.shootDate) &&
      (order.deliveryDate || order.shootDate)! < asOf;
    items.push({
      id: "money-outstanding",
      title: overdue ? "Chase overdue balance?" : "Collect remaining balance?",
      detail: `${finance.outstanding.toLocaleString("en-EG")} EGP outstanding`,
      severity: overdue ? "critical" : "warning",
      destination: "money",
    });
  }

  const awaiting = assignments.filter(
    (a) => a.assignmentStatus === "assigned"
  );
  if (awaiting.length > 0 && (capabilities.canAssignCrew || capabilities.canEdit)) {
    items.push({
      id: "crew-confirm",
      title: "Confirm crew assignments?",
      detail: `${awaiting.length} still assigned — not confirmed${
        shootIn != null && shootIn <= 2 ? " · shoot soon" : ""
      }`,
      severity:
        shootIn != null && shootIn >= 0 && shootIn <= 2 ? "critical" : "warning",
      destination: "crew",
    });
  }

  if (
    isOrderOperational(order.status) &&
    !hasCrew(order, assignments) &&
    capabilities.canAssignCrew
  ) {
    items.push({
      id: "crew-missing",
      title: "Who shoots this?",
      detail: "No crew assigned on an active order.",
      severity:
        shootIn != null && shootIn >= 0 && shootIn <= 2 ? "critical" : "warning",
      destination: "crew",
    });
  }

  if (deliveryOverdue(order, deliveries, asOf)) {
    items.push({
      id: "delivery-overdue",
      title: "Unblock overdue delivery?",
      detail: order.deliveryDate
        ? `Due ${order.deliveryDate} — still open`
        : "Delivery past due",
      severity: "critical",
      destination: "deliverables",
    });
  }

  const pending = pendingDeliverables(order, deliveries);
  if (
    pending.length > 0 &&
    !deliveryOverdue(order, deliveries, asOf) &&
    deliverySoon(order, deliveries, asOf)
  ) {
    items.push({
      id: "delivery-soon",
      title: "Prioritize remaining deliverables?",
      detail: pending.slice(0, 3).join(", "),
      severity: "info",
      destination: "deliverables",
    });
  }

  if (isOrderHolding(order.status) && capabilities.canUpdateStatus) {
    items.push({
      id: "holding-confirm",
      title: "Confirm into pipeline?",
      detail: "Order still holding — not live in ops.",
      severity: "info",
      destination: "status",
    });
  }

  const severityRank = { critical: 0, warning: 1, info: 2 } as const;
  return items
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .slice(0, 5);
}

export interface WhatsNextItem {
  id: string;
  label: string;
  when: string;
  tone: "neutral" | "warning" | "danger" | "success";
}

/** Upcoming beats for Story → What's Next (from real dates/status). */
export function generateWhatsNext(input: DoNowInput): WhatsNextItem[] {
  const { order, deliveries, assignments, finance, asOf } = input;
  const items: WhatsNextItem[] = [];
  const shootIn = daysUntil(order.shootDate, asOf);

  if (
    order.shootDate &&
    !isOrderCompleted(order.status) &&
    order.status !== "Cancelled" &&
    (shootIn == null || shootIn >= 0)
  ) {
    items.push({
      id: "shoot",
      label: `Shoot · ${order.location || "location TBD"}`,
      when:
        shootIn === 0
          ? "Today"
          : shootIn === 1
            ? "Tomorrow"
            : order.shootDate,
      tone: shootIn != null && shootIn <= 1 ? "warning" : "neutral",
    });
  }

  if (
    order.deliveryDate &&
    !isOrderCompleted(order.status) &&
    order.status !== "Cancelled"
  ) {
    const dIn = daysUntil(order.deliveryDate, asOf);
    items.push({
      id: "delivery",
      label: "Client delivery due",
      when:
        dIn != null && dIn < 0
          ? `Overdue · ${order.deliveryDate}`
          : dIn === 0
            ? "Today"
            : order.deliveryDate,
      tone:
        dIn != null && dIn < 0
          ? "danger"
          : dIn != null && dIn <= 3
            ? "warning"
            : "neutral",
    });
  }

  for (const d of deliveries.filter(
    (x) => x.status === "pending" || x.status === "in_progress"
  )) {
    items.push({
      id: `del-${d.id}`,
      label: d.label,
      when: d.dueDate < asOf ? `Overdue · ${d.dueDate}` : d.dueDate,
      tone: d.dueDate < asOf ? "danger" : "neutral",
    });
  }

  const awaiting = assignments.filter(
    (a) => a.assignmentStatus === "assigned"
  );
  if (awaiting.length > 0 && shootIn != null && shootIn >= 0 && shootIn <= 7) {
    items.push({
      id: "confirm-before-shoot",
      label: `Confirm ${awaiting.length} crew before shoot`,
      when: order.shootDate,
      tone: "warning",
    });
  }

  if (finance.outstanding > 0.009 && order.status !== "Cancelled") {
    items.push({
      id: "collect",
      label: `Collect remaining ${finance.outstanding.toLocaleString("en-EG")} EGP`,
      when: "Open",
      tone: "warning",
    });
  }

  if (items.length === 0 && isOrderCompleted(order.status)) {
    items.push({
      id: "done",
      label: "Nothing queued — order complete",
      when: "—",
      tone: "success",
    });
  }

  return items.slice(0, 6);
}
