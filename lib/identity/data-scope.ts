/**
 * Thin data-scope helpers — filter lists by Access Level (Mission 04.5.0 / 04.5).
 * No schema changes. Prefer empty/honest results over inventing ownership.
 */

import {
  getAssignmentById,
  getAssignments,
  getAssignmentsByOrder,
  getAssignmentsByPerson,
} from "@/lib/assignments/repository";
import type { Client } from "@/lib/clients/types";
import type { BusinessEvent, BusinessEventType } from "@/lib/core/types";
import type { AccessLevel } from "@/lib/identity/access-levels";
import type { SodaSession } from "@/lib/identity/session";
import type { Order } from "@/lib/orders/types";
import type { Person } from "@/lib/people/types";
import type { Project } from "@/lib/projects/types";
import {
  getQuotationById,
  getQuotations,
} from "@/lib/quotations/repository";

export type DataScope = {
  accessLevel: AccessLevel;
  personId: string | null;
  displayName: string;
  /** Empty set for founder (meaning all). Otherwise allowlist. */
  orderIds: Set<string> | null;
  clientIds: Set<string> | null;
  personIds: Set<string> | null;
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function isCommercialOrder(order: Order, clientsById: Map<string, Client>): boolean {
  if (order.projectType === "Commercial") return true;
  const clientId = order.clientId;
  if (!clientId) return false;
  return clientsById.get(clientId)?.segment === "commercial";
}

/** Crew ids that share squad/assignment work with the operator. */
export function resolveTeamPersonIds(personId: string): Set<string> {
  const team = new Set<string>([personId]);
  const assignments = getAssignmentsByPerson(personId);
  for (const a of assignments) {
    team.add(a.personId);
    for (const peer of getAssignmentsByOrder(a.orderId)) {
      team.add(peer.personId);
    }
  }
  return team;
}

function orderTouchesPerson(order: Order, personId: string): boolean {
  if (order.squadMemberIds.includes(personId)) return true;
  return getAssignmentsByOrder(order.id).some((a) => a.personId === personId);
}

function orderTouchesTeam(order: Order, teamIds: Set<string>): boolean {
  if (order.squadMemberIds.some((id) => teamIds.has(id))) return true;
  return getAssignmentsByOrder(order.id).some((a) => teamIds.has(a.personId));
}

/**
 * Build scope allowlists from session + in-memory domain caches.
 * Call after refresh* for the domains you care about.
 */
export function buildDataScope(
  session: SodaSession,
  input: {
    orders: readonly Order[];
    clients: readonly Client[];
  }
): DataScope {
  const accessLevel = session.profile.accessLevel;
  const personId = session.profile.personId;
  const displayName =
    session.profile.displayName || session.profile.fullName || "";

  if (accessLevel === "founder") {
    return {
      accessLevel,
      personId,
      displayName,
      orderIds: null,
      clientIds: null,
      personIds: null,
    };
  }

  const clientsById = new Map(input.clients.map((c) => [c.id, c]));
  const orderIds = new Set<string>();
  const clientIds = new Set<string>();
  const personIds = new Set<string>();

  if (accessLevel === "account_manager") {
    const name = norm(displayName);
    const relatedFromQuotes = new Set<string>();
    if (name) {
      for (const q of getQuotations()) {
        if (norm(q.assignedSales) === name && q.clientId) {
          relatedFromQuotes.add(q.clientId);
        }
      }
    }

    for (const order of input.orders) {
      const commercial = isCommercialOrder(order, clientsById);
      const clientMatch =
        !!order.clientId && relatedFromQuotes.has(order.clientId);
      if (!commercial && !clientMatch) continue;
      orderIds.add(order.id);
      if (order.clientId) clientIds.add(order.clientId);
    }
    for (const id of relatedFromQuotes) clientIds.add(id);
  } else if (accessLevel === "team_leader") {
    if (!personId) {
      // No crew link → honest empty scope (never company-wide).
      return {
        accessLevel,
        personId,
        displayName,
        orderIds: orderIds,
        clientIds: clientIds,
        personIds: personIds,
      };
    }
    const team = resolveTeamPersonIds(personId);
    for (const id of team) personIds.add(id);
    for (const order of input.orders) {
      if (!orderTouchesTeam(order, team)) continue;
      orderIds.add(order.id);
      if (order.clientId) clientIds.add(order.clientId);
    }
  } else {
    // team
    if (!personId) {
      return {
        accessLevel,
        personId,
        displayName,
        orderIds,
        clientIds,
        personIds,
      };
    }
    personIds.add(personId);
    for (const order of input.orders) {
      if (!orderTouchesPerson(order, personId)) continue;
      orderIds.add(order.id);
      if (order.clientId) clientIds.add(order.clientId);
    }
  }

  return {
    accessLevel,
    personId,
    displayName,
    orderIds,
    clientIds,
    personIds,
  };
}

export function scopeOrders(
  orders: readonly Order[],
  scope: DataScope
): Order[] {
  if (!scope.orderIds) return [...orders];
  return orders.filter((o) => scope.orderIds!.has(o.id));
}

export function scopeClients(
  clients: readonly Client[],
  scope: DataScope
): Client[] {
  if (!scope.clientIds) return [...clients];
  return clients.filter((c) => scope.clientIds!.has(c.id));
}

export function scopePeople(
  people: readonly Person[],
  scope: DataScope
): Person[] {
  if (!scope.personIds) return [...people];
  return people.filter((p) => scope.personIds!.has(p.id));
}

export function scopeProjects(
  projects: readonly Project[],
  scope: DataScope
): Project[] {
  if (!scope.orderIds && !scope.clientIds) return [...projects];
  return projects.filter((p) => {
    if (scope.clientIds?.has(p.clientId)) return true;
    if (
      scope.personIds &&
      p.team?.some((m) => scope.personIds!.has(m.id))
    ) {
      return true;
    }
    return false;
  });
}

/** Re-apply allowlist after client-side cache refresh. */
export function filterOrdersByScopeIds(
  orders: readonly Order[],
  allowedIds: readonly string[] | null | undefined
): Order[] {
  if (!allowedIds) return [...orders];
  const set = new Set(allowedIds);
  return orders.filter((o) => set.has(o.id));
}

export function filterClientsByScopeIds(
  clients: readonly Client[],
  allowedIds: readonly string[] | null | undefined
): Client[] {
  if (!allowedIds) return [...clients];
  const set = new Set(allowedIds);
  return clients.filter((c) => set.has(c.id));
}

/** Assignment rows visible under scope (team / personal). */
export function scopeAssignmentOrderIds(scope: DataScope): Set<string> | null {
  if (scope.accessLevel === "founder") return null;
  if (scope.orderIds) return scope.orderIds;
  return new Set();
}

export function isOrderIdInScope(
  orderId: string,
  scope: DataScope
): boolean {
  if (!scope.orderIds) return true;
  return scope.orderIds.has(orderId);
}

/** Debug / UI note when scope is empty because crew is unlinked. */
export function scopeEmptyReason(scope: DataScope): string | null {
  if (scope.accessLevel === "founder") return null;
  if (
    (scope.accessLevel === "team_leader" || scope.accessLevel === "team") &&
    !scope.personId
  ) {
    return "No crew profile linked to this login — work stays empty until Founder links identity.";
  }
  return null;
}

/** Keep getAssignments available for calendar scoping without re-import churn. */
export function assignmentsTouchingScope(scope: DataScope) {
  if (!scope.personIds) return getAssignments();
  return getAssignments().filter((a) => scope.personIds!.has(a.personId));
}

/**
 * Company financial / vault signals — Founder only.
 * Never surface as Team / TL / AM notifications (Mission 04.5).
 */
export const COMPANY_FINANCE_EVENT_TYPES: ReadonlySet<BusinessEventType> =
  new Set([
    "PaymentReceived",
    "PaymentUpdated",
    "InvoiceCreated",
    "InvoicePaid",
    "InvoiceUpdated",
    "CrewPaid",
    "CrewBonusGenerated",
    "ExpenseRecorded",
    "TransferCompleted",
    "FinancialReversed",
    "FinancialVoided",
    "FinancialCorrected",
    "PeriodClosed",
    "PeriodReopened",
    "OpeningBalancePosted",
    "ManualAdjustmentPosted",
  ]);

function quotationTouchesScope(
  quotationId: string,
  scope: DataScope
): boolean {
  const q = getQuotationById(quotationId);
  if (!q) return false;
  if (q.clientId && scope.clientIds?.has(q.clientId)) return true;
  if (scope.accessLevel === "account_manager" && scope.displayName) {
    const name = norm(scope.displayName);
    if (name && norm(q.assignedSales) === name) return true;
  }
  return false;
}

/**
 * Whether a business event is visible under this data scope.
 * Founder → all. Others → never finance alerts; must touch order/client/person/quote scope.
 */
export function isBusinessEventInScope(
  event: BusinessEvent,
  scope: DataScope
): boolean {
  if (scope.accessLevel === "founder") return true;

  // Company financial / vault signals — Founder only (already returned above).
  if (COMPANY_FINANCE_EVENT_TYPES.has(event.type)) {
    return false;
  }

  // Unlinked crew → honest empty (never company-wide).
  if (
    (scope.accessLevel === "team" || scope.accessLevel === "team_leader") &&
    !scope.personId
  ) {
    return false;
  }

  const p = event.payload;

  if (p.orderId && scope.orderIds?.has(p.orderId)) return true;
  if (p.clientId && scope.clientIds?.has(p.clientId)) return true;
  if (p.personId && scope.personIds?.has(p.personId)) return true;

  if (p.entityType === "order" && scope.orderIds?.has(p.entityId)) {
    return true;
  }
  if (p.entityType === "client" && scope.clientIds?.has(p.entityId)) {
    return true;
  }
  if (p.entityType === "person" && scope.personIds?.has(p.entityId)) {
    return true;
  }
  if (p.entityType === "project") {
    // Project visibility follows linked client when present.
    if (p.clientId && scope.clientIds?.has(p.clientId)) return true;
    return false;
  }

  const assignmentId =
    p.assignmentId ??
    (p.entityType === "assignment" ? p.entityId : undefined);
  if (assignmentId) {
    const a = getAssignmentById(assignmentId);
    if (a) {
      if (scope.personIds?.has(a.personId)) return true;
      if (scope.orderIds?.has(a.orderId)) return true;
    }
  }

  const quotationId =
    p.quotationId ??
    (p.entityType === "quotation" ? p.entityId : undefined);
  if (quotationId && quotationTouchesScope(quotationId, scope)) {
    return true;
  }

  // Team: only personal / assignment-touching signals (never company orphans).
  // TL / AM: same — no global fallthrough.
  return false;
}

export function scopeBusinessEvents(
  events: readonly BusinessEvent[],
  scope: DataScope
): BusinessEvent[] {
  if (scope.accessLevel === "founder") return [...events];
  return events.filter((e) => isBusinessEventInScope(e, scope));
}

/** Recent Orders section titles by Access Level (Mission 04.5). */
export function recentOrdersCopy(level: AccessLevel): {
  title: string;
  description: string;
} {
  switch (level) {
    case "founder":
      return {
        title: "Recent Company Orders",
        description: "آخر الأوردرات اللي دخلت الشركة.",
      };
    case "team_leader":
      return {
        title: "Recent Team Orders",
        description: "أوردرات فريقك الأخيرة.",
      };
    case "account_manager":
      return {
        title: "Recent Client Orders",
        description: "أوردرات عملائك الأخيرة.",
      };
    default:
      return {
        title: "My Recent Orders",
        description: "الأوردرات المتسجلة عليك.",
      };
  }
}
