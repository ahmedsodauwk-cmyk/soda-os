/**
 * Role-aware Home data assembly — scoped loaders, no company finance for non-Founder.
 */

import { getClients } from "@/lib/clients/repository";
import { loadScopedDashboardSnapshot } from "@/lib/dashboard/scoped-snapshot";
import type { AccessLevel } from "@/lib/identity/access-levels";
import {
  buildDataScope,
  scopeClients,
  scopeOrders,
} from "@/lib/identity/data-scope";
import type { SodaSession } from "@/lib/identity/session";
import { getOrders } from "@/lib/orders/repository";
import { isOrderActiveWorkload } from "@/lib/orders/status";
import { getPeople } from "@/lib/people/repository";
import { getQuotations } from "@/lib/quotations/repository";

export type RoleHomeData = Awaited<ReturnType<typeof loadRoleHomeData>>;

export async function loadRoleHomeData(session: SodaSession) {
  const { dashboard, scope } = await loadScopedDashboardSnapshot(session);
  const level = session.profile.accessLevel;
  const operatorName =
    session.profile.displayName ?? session.profile.fullName ?? null;

  const allOrders = getOrders();
  const allClients = getClients();
  const scopedOrders = scopeOrders(allOrders, scope);
  const scopedClients = scopeClients(allClients, scope);

  const quotations = getQuotations().filter((q) => {
    if (level === "account_manager") {
      const name = (operatorName ?? "").trim().toLowerCase();
      const nameMatch =
        !!name && (q.assignedSales ?? "").trim().toLowerCase() === name;
      const clientMatch = !!q.clientId && scope.clientIds?.has(q.clientId);
      return nameMatch || clientMatch;
    }
    if (level === "team_leader" || level === "team") {
      if (q.clientId && scope.clientIds?.has(q.clientId)) return true;
      return false;
    }
    return false;
  });

  const pendingQuotations = quotations.filter(
    (q) =>
      q.pipelineStage === "Draft" ||
      q.pipelineStage === "Internal Review" ||
      q.pipelineStage === "Sent" ||
      q.pipelineStage === "New Inquiry" ||
      q.pipelineStage === "Discovery"
  );

  const followUpQuotations = quotations.filter(
    (q) =>
      q.pipelineStage === "Client Feedback" ||
      q.pipelineStage === "Revision" ||
      q.pipelineStage === "Sent"
  );

  const activeCommercialOrders = scopedOrders.filter(
    (o) =>
      isOrderActiveWorkload(o.status) &&
      (o.projectType === "Commercial" ||
        scopedClients.some(
          (c) => c.id === o.clientId && c.segment === "commercial"
        ))
  );

  const waitingClientOrders = scopedOrders.filter(
    (o) => o.status === "Holding" || o.status === "Pending"
  );

  const pendingDeliveries = scopedOrders
    .filter(
      (o) =>
        o.status === "Editing" ||
        o.status === "Completed" ||
        Boolean(o.deliveryDate)
    )
    .filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");

  const teamMembers =
    scope.personIds && scope.personIds.size > 0
      ? scope.personIds.size
      : level === "team_leader"
        ? getPeople().filter((p) =>
            scope.personIds ? scope.personIds.has(p.id) : false
          ).length
        : 0;

  return {
    accessLevel: level as Exclude<AccessLevel, "founder">,
    operatorName,
    dashboard,
    scope,
    scopedOrders,
    pendingQuotations,
    followUpQuotations,
    waitingClientOrders,
    activeCommercialOrders,
    teamOrders: scopedOrders,
    pendingDeliveries,
    teamMembers,
  };
}

/** Rebuild scope from session without full snapshot refresh (for tests). */
export function buildScopeFromSession(session: SodaSession) {
  return buildDataScope(session, {
    orders: getOrders(),
    clients: getClients(),
  });
}
