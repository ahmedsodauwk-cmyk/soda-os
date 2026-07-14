import { AppShell } from "@/components/layout/app-shell";
import AttentionCenter from "@/components/dashboard/attention-center";
import { AccessLevelHome } from "@/components/dashboard/access-level-home";
import CompanyPulse from "@/components/dashboard/company-pulse";
import DashboardHero from "@/components/dashboard/dashboard-hero";
import FinancialOverviewCard from "@/components/dashboard/financial-overview";
import {
  HumanMessage,
  SmartTip,
} from "@/components/dashboard/human-home";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentOrders from "@/components/dashboard/recent-orders";
import SodaLiveFeed from "@/components/dashboard/soda-live";
import TodayFocus from "@/components/dashboard/today-focus";
import UpcomingScheduleCard from "@/components/dashboard/upcoming-schedule";
import { WelcomeGate } from "@/components/dashboard/welcome-gate";
import { QuotationPipelineCard } from "@/components/quotations/quotation-pipeline-card";
import { getCompanyPulse } from "@/lib/brand";
import { buildActivityFeed } from "@/lib/dashboard/activity-feed";
import { buildDashboardSnapshot } from "@/lib/dashboard/stats";
import { loadDashboardSnapshot } from "@/lib/dashboard";
import {
  buildDataScope,
  scopeClients,
  scopeEmptyReason,
  scopeOrders,
  scopeProjects,
} from "@/lib/identity/data-scope";
import { permissionsForAsync } from "@/lib/identity/permission-service";
import { resolveSessionForApp } from "@/lib/identity/session";
import { setHasAny, type Permission } from "@/lib/identity/permissions";
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
 * Other Access Levels get scoped widgets + scoped data (Mission 04.5.0).
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

  // Founder — unchanged company command center.
  if (!session || level === "founder") {
    const [dashboard] = await Promise.all([loadDashboardSnapshot()]);
    const liveEvents = buildActivityFeed();
    const pulse = getCompanyPulse(dashboard);
    const voiceInput = {
      kpis: dashboard.kpis,
      attention: dashboard.attention,
      schedule: dashboard.schedule,
    };

    const showFinance =
      !!allowed &&
      setHasAny(allowed, [
        "finance.view",
        "dashboard.finance",
      ] as Permission[]);
    const showOrders =
      !!allowed && setHasAny(allowed, ["orders.view"] as Permission[]);
    const showSchedule =
      !!allowed &&
      setHasAny(allowed, ["calendar.view", "orders.view"] as Permission[]);
    const showQuotations =
      !!allowed && setHasAny(allowed, ["quotations.view"] as Permission[]);
    const showCompanyPulse =
      !!allowed &&
      setHasAny(allowed, [
        "dashboard.company",
        "dashboard.team",
      ] as Permission[]);

    return (
      <AppShell titleKey="pages.home" layer="dashboard" session={session}>
        <WelcomeGate dashboard={voiceInput}>
          <div className="soda-page-enter space-y-3 sm:space-y-4">
            <DashboardHero dashboard={voiceInput} operatorName={operatorName} />

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5 lg:gap-4">
              <div className="lg:col-span-3">
                <TodayFocus dashboard={voiceInput} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
                <HumanMessage
                  dashboard={voiceInput}
                  operatorName={operatorName}
                />
                <SmartTip dashboard={voiceInput} />
              </div>
            </div>

            <QuickActions
              allowedPermissions={allowed}
              accessLevel={level ?? undefined}
            />

            <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-5">
              <div className="xl:col-span-2">
                <SodaLiveFeed events={liveEvents} className="h-full" />
              </div>
              {showCompanyPulse ? (
                <div className="xl:col-span-3">
                  <CompanyPulse insights={pulse} />
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-5">
              <div id="attention" className="scroll-mt-24 xl:col-span-2">
                <AttentionCenter items={dashboard.attention} />
              </div>
              {showFinance ? (
                <div className="xl:col-span-3">
                  <FinancialOverviewCard
                    financial={dashboard.financial}
                    monthlyRevenue={dashboard.monthlyRevenue}
                  />
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-2">
              {showSchedule ? (
                <div id="schedule" className="scroll-mt-24">
                  <UpcomingScheduleCard schedule={dashboard.schedule} />
                </div>
              ) : null}
              {showOrders ? (
                <RecentOrders orders={dashboard.recentOrders} />
              ) : null}
            </div>

            {showQuotations ? <QuotationPipelineCard /> : null}
          </div>
        </WelcomeGate>
      </AppShell>
    );
  }

  // Non-Founder — scoped domain refresh + scoped snapshot (no company finance).
  await refreshDashboardDomainData();
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
