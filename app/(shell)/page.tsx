import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AccessLevelHome } from "@/components/dashboard/access-level-home";
import { FounderHomeStream } from "@/components/dashboard/founder-home-stream";
import { HomeGreetingFirst } from "@/components/dashboard/home-greeting-first";
import { WelcomeGate } from "@/components/dashboard/welcome-gate";
import { SkeletonDashboardHome } from "@/components/ui/soda-skeleton";
import { BOOT_BUDGET_MS, withTimeout } from "@/lib/async/with-timeout";
import { buildDashboardSnapshot } from "@/lib/dashboard/stats";
import {
  buildDataScope,
  scopeClients,
  scopeEmptyReason,
  scopeOrders,
  scopeProjects,
} from "@/lib/identity/data-scope";
import { permissionsForAsync } from "@/lib/identity/permission-service";
import { resolveSessionForApp } from "@/lib/identity/session";
import { getClients } from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import { isOrderActiveWorkload } from "@/lib/orders/status";
import { getProjects } from "@/lib/projects/repository";
import { getQuotations } from "@/lib/quotations/repository";
import { getWorkspaceSummaries } from "@/lib/workspaces/repository";
import { refreshDashboardDomainData } from "@/lib/supabase/refresh-all";

export const dynamic = "force-dynamic";

/**
 * Command Center — Founder keeps full company Home.
 * Other Access Levels get scoped widgets + scoped data (Mission 04.5).
 * Mission 06.0: greeting first; Founder widgets stream under Suspense.
 */
export default async function Home() {
  const session = await resolveSessionForApp();
  const level = session?.profile.accessLevel ?? null;

  const permResult = session
    ? await permissionsForAsync(session.profile.accessLevel)
    : null;
  const allowed =
    permResult && Array.isArray(permResult.permissions)
      ? [...permResult.permissions]
      : undefined;

  const operatorName =
    session?.profile.displayName ?? session?.profile.fullName ?? null;

  // Founder — greeting paints immediately; heavy snapshot streams independently.
  if (!session || level === "founder") {
    return (
      <AppShell titleKey="pages.home" layer="dashboard" session={session}>
        <Suspense
          fallback={
            <>
              <HomeGreetingFirst operatorName={operatorName} />
              <SkeletonDashboardHome />
            </>
          }
        >
          <FounderHomeStream
            operatorName={operatorName}
            allowed={allowed}
            level={level}
          />
        </Suspense>
      </AppShell>
    );
  }

  // Non-Founder — scoped domain refresh + scoped snapshot (no company finance).
  // Soft Team session must not hang forever on domain fan-out.
  await withTimeout(refreshDashboardDomainData(), BOOT_BUDGET_MS, undefined);
  const allOrders = getOrders();
  const allClients = getClients();
  const scope = buildDataScope(session, {
    orders: allOrders,
    clients: allClients,
  });
  const scopedOrders = scopeOrders(allOrders, scope);
  const scopedClients = scopeClients(allClients, scope);
  const scopedProjects = scopeProjects(getProjects(), scope);

  const dashboard = buildDashboardSnapshot({
    projects: scopedProjects,
    orders: scopedOrders,
    clients: scopedClients,
    payments: [],
    workspaceSummaries: getWorkspaceSummaries(),
  });

  const voiceInput = {
    kpis: dashboard.kpis,
    attention: dashboard.attention,
    schedule: dashboard.schedule,
  };

  const quotations = getQuotations().filter((q) => {
    if (level === "account_manager") {
      const name = (operatorName ?? "").trim().toLowerCase();
      const nameMatch =
        !!name && (q.assignedSales ?? "").trim().toLowerCase() === name;
      const clientMatch =
        !!q.clientId && scope.clientIds?.has(q.clientId);
      return nameMatch || clientMatch;
    }
    return true;
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
  const pendingDeliveries = scopedOrders.filter(
    (o) =>
      o.status === "Editing" ||
      o.status === "Completed" ||
      Boolean(o.deliveryDate)
  ).filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");

  return (
    <AppShell titleKey="pages.home" layer="dashboard" session={session}>
      <WelcomeGate dashboard={voiceInput}>
        <AccessLevelHome
          accessLevel={session.profile.accessLevel}
          operatorName={operatorName}
          voiceInput={voiceInput}
          dashboard={dashboard}
          allowedPermissions={allowed}
          scope={scope}
          scopedOrders={scopedOrders}
          pendingQuotations={pendingQuotations}
          followUpQuotations={followUpQuotations}
          waitingClientOrders={waitingClientOrders}
          activeCommercialOrders={activeCommercialOrders}
          teamOrders={scopedOrders}
          pendingDeliveries={pendingDeliveries}
          scopeNote={scopeEmptyReason(scope)}
        />
      </WelcomeGate>
    </AppShell>
  );
}
