/**
 * SODA LIVE activity feed — chronological business events from real repos.
 * No invented quotes or motivational filler.
 */

import { getAssignments } from "@/lib/assignments/repository";
import { getClients } from "@/lib/clients/repository";
import { getDashboardAsOf } from "@/lib/dashboard/types";
import { JOURNEY_STAGE_LABELS } from "@/lib/journey/types";
import { getOrders } from "@/lib/orders/repository";
import { getPayments } from "@/lib/payments/repository";
import { getProjects } from "@/lib/projects/repository";
import { getPeople } from "@/lib/people/repository";

export type ActivityFeedKind =
  | "order"
  | "payment"
  | "delivery"
  | "shoot"
  | "journey"
  | "file"
  | "assignment"
  | "status";

export interface ActivityFeedEvent {
  id: string;
  /** ISO date or datetime for sort + display */
  at: string;
  /** Short clock / date label for the feed row */
  timeLabel: string;
  kind: ActivityFeedKind;
  category: string;
  description: string;
  href?: string;
}

const LIVE_ROTATE_MS = 10_000;

export function getActivityFeedRotateMs(): number {
  return LIVE_ROTATE_MS;
}

function toTimeLabel(iso: string): string {
  const hasTime = iso.includes("T");
  if (hasTime) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Africa/Cairo",
      });
    }
  }
  // Date-only — show month/day relative to studio as-of
  const day = iso.slice(0, 10);
  if (day === getDashboardAsOf()) return "Today";
  return day.slice(5); // MM-DD
}

function sortNewest(a: ActivityFeedEvent, b: ActivityFeedEvent): number {
  return b.at.localeCompare(a.at);
}

/** Build chronological feed from orders, payments, projects, assignments. */
export function buildActivityFeed(opts?: {
  /** null = all (Founder). Set = allowlist. */
  orderIds?: Set<string> | null;
  personIds?: Set<string> | null;
  /** Company payment signals — Founder only. */
  includePayments?: boolean;
}): ActivityFeedEvent[] {
  const orderAllow = opts?.orderIds;
  const personAllow = opts?.personIds;
  const includePayments = opts?.includePayments !== false;

  const events: ActivityFeedEvent[] = [];
  const clients = getClients();
  const clientName = (id: string) =>
    clients.find((c) => c.id === id)?.name ?? "Client";
  const people = getPeople();
  const personName = (id: string) => {
    const p = people.find((x) => x.id === id);
    return p?.nameEn ?? p?.nameAr ?? "Crew";
  };

  const orders =
    orderAllow === undefined || orderAllow === null
      ? getOrders()
      : getOrders().filter((o) => orderAllow.has(o.id));
  for (const order of orders) {
    // Status / pipeline presence as operational event
    events.push({
      id: `order-status-${order.id}`,
      at: order.shootDate,
      timeLabel: toTimeLabel(order.shootDate),
      kind: "status",
      category: "Order status",
      description: `${order.clientName} · ${order.projectType} → ${order.status}`,
      href: `/orders/${order.id}`,
    });

    if (order.deliveryDate) {
      events.push({
        id: `delivery-${order.id}`,
        at: order.deliveryDate,
        timeLabel: toTimeLabel(order.deliveryDate),
        kind: "delivery",
        category: "Delivery",
        description: `${order.clientName} · delivery ${order.deliveryDate}`,
        href: `/orders/${order.id}`,
      });
    }

    if (
      order.status === "Scheduled" ||
      order.status === "Shooting" ||
      order.status === "Pending"
    ) {
      events.push({
        id: `shoot-${order.id}`,
        at: order.shootDate,
        timeLabel: toTimeLabel(order.shootDate),
        kind: "shoot",
        category: "Shoot",
        description: `${order.clientName} · ${order.location || "TBD"} · ${order.status}`,
        href: `/orders/${order.id}`,
      });
    }
  }

  // Newer orders first as "new order" signal (by id / shoot date)
  for (const order of [...orders]
    .sort((a, b) => b.shootDate.localeCompare(a.shootDate))
    .slice(0, 6)) {
    events.push({
      id: `new-order-${order.id}`,
      at: order.shootDate,
      timeLabel: toTimeLabel(order.shootDate),
      kind: "order",
      category: "New order",
      description: `${order.clientName} · ${order.projectType} · ${order.price.toLocaleString("en-EG")} EGP`,
      href: `/orders/${order.id}`,
    });
  }

  if (includePayments) {
    for (const payment of getPayments()) {
      if (payment.status !== "paid" || !payment.paidAt) continue;
      if (
        orderAllow &&
        payment.orderId &&
        !orderAllow.has(payment.orderId)
      ) {
        continue;
      }
      if (orderAllow && !payment.orderId) continue;
      events.push({
        id: `payment-${payment.id}`,
        at: payment.paidAt,
        timeLabel: toTimeLabel(payment.paidAt),
        kind: "payment",
        category: "Payment",
        description: `${clientName(payment.clientId)} · ${payment.label ?? payment.kind} · ${payment.amount.toLocaleString("en-EG")} EGP`,
        href: payment.orderId
          ? `/orders/${payment.orderId}`
          : `/clients/${payment.clientId}`,
      });
    }
  }

  for (const project of getProjects()) {
    if (
      personAllow &&
      !project.team?.some((m) => personAllow.has(m.id))
    ) {
      continue;
    }

    if (project.journeyStage) {
      events.push({
        id: `journey-${project.id}-${project.journeyStage}`,
        at: project.updatedAt,
        timeLabel: toTimeLabel(project.updatedAt),
        kind: "journey",
        category: "Journey",
        description: `${project.name} · ${JOURNEY_STAGE_LABELS[project.journeyStage]}`,
        href: `/projects/${project.id}`,
      });
    }

    for (const file of project.files.slice(0, 3)) {
      events.push({
        id: `file-${project.id}-${file.id}`,
        at: file.updatedAt,
        timeLabel: toTimeLabel(file.updatedAt),
        kind: "file",
        category: "File upload",
        description: `${project.clientName} · ${file.name}`,
        href: `/projects/${project.id}`,
      });
    }

    for (const act of project.activity.slice(0, 4)) {
      events.push({
        id: `activity-${project.id}-${act.id}`,
        at: act.createdAt,
        timeLabel: toTimeLabel(act.createdAt),
        kind: "status",
        category: "Project activity",
        description: `${act.actor} · ${act.action}`,
        href: `/projects/${project.id}`,
      });
    }
  }

  for (const a of getAssignments()) {
    if (personAllow && !personAllow.has(a.personId)) continue;
    if (orderAllow && !orderAllow.has(a.orderId)) continue;
    events.push({
      id: `assign-${a.id}`,
      at: a.createdAt,
      timeLabel: toTimeLabel(a.createdAt),
      kind: "assignment",
      category: "Crew assignment",
      description: `${personName(a.personId)} · ${a.role} on ${a.orderId}`,
      href: `/people/${a.personId}`,
    });
  }

  // Dedupe by id, sort newest, cap for rotation
  const seen = new Set<string>();
  const unique = events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  return unique.sort(sortNewest).slice(0, 24);
}
