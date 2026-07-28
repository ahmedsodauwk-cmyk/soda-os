/**
 * Role-aware Home body — shared V3 shell for non-Founder Access Levels.
 * Same visual tokens, motion, and grid as FounderHomeStream; scoped data only.
 */

import Link from "next/link";
import { Bell, CalendarDays, ClipboardList } from "lucide-react";

import { FounderCommandHeader } from "@/components/dashboard/founder-command-header";
import { FounderLiveClock } from "@/components/dashboard/founder-live-clock";
import { FounderNeedsDecision } from "@/components/dashboard/founder-needs-decision";
import { FounderRecentActivity } from "@/components/dashboard/founder-recent-activity";
import { HomePanelCard } from "@/components/dashboard/home-panel-card";
import { RoleAwareKpiRow } from "@/components/dashboard/role-aware-kpi-row";
import { RoleAwareQuickActionsPanel } from "@/components/dashboard/role-aware-quick-actions-panel";
import { ScopedHomeUpdates } from "@/components/dashboard/scoped-home-updates";
import TodayFocus from "@/components/dashboard/today-focus";
import UpcomingScheduleCard from "@/components/dashboard/upcoming-schedule";
import { WelcomeGate } from "@/components/dashboard/welcome-gate";
import {
  buildRoleKpiMetrics,
  filterAttentionForHome,
  getRoleHomePanelCopy,
  scopeVoiceInputForHome,
} from "@/lib/dashboard/home-registry";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import type { AccessLevel } from "@/lib/identity/access-levels";
import {
  recentOrdersCopy,
  scopeEmptyReason,
  type DataScope,
} from "@/lib/identity/data-scope";
import { setHasAny, type Permission } from "@/lib/identity/permissions";
import type { Order } from "@/lib/orders/types";
import type { Quotation } from "@/lib/quotations/types";
import { isOrderActiveWorkload } from "@/lib/orders/status";

type Props = {
  accessLevel: Exclude<AccessLevel, "founder">;
  operatorName: string | null;
  dashboard: DashboardSnapshot;
  allowed?: readonly Permission[];
  scope: DataScope;
  scopedOrders: Order[];
  pendingQuotations: Quotation[];
  followUpQuotations: Quotation[];
  waitingClientOrders: Order[];
  activeCommercialOrders: Order[];
  teamOrders: Order[];
  pendingDeliveries: Order[];
  teamMembers: number;
};

function OrderLines({ orders, empty }: { orders: Order[]; empty: string }) {
  if (orders.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">{empty}</p>
    );
  }
  return (
    <ul className="divide-y divide-border/40">
      {orders.slice(0, 5).map((o) => (
        <li key={o.id}>
          <Link
            href={`/orders/${o.id}`}
            className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-muted/40 hover:text-soda-pink"
          >
            <span className="truncate font-medium">{o.clientName}</span>
            <span className="shrink-0 text-muted-foreground">{o.status}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function QuotationLines({
  quotations,
  empty,
}: {
  quotations: Quotation[];
  empty: string;
}) {
  if (quotations.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">{empty}</p>
    );
  }
  return (
    <ul className="divide-y divide-border/40">
      {quotations.slice(0, 5).map((q) => (
        <li key={q.id}>
          <Link
            href={`/quotations/${q.id}`}
            className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-muted/40 hover:text-soda-pink"
          >
            <span className="truncate font-medium">
              {q.clientName || q.id}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {q.pipelineStage}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function WorkspacePlaceholder({ message }: { message: string }) {
  return (
    <HomePanelCard
      title="My Workspace"
      layer="dashboard"
      isEmpty
      emptyMessage={message}
    >
      <span />
    </HomePanelCard>
  );
}

export async function RoleAwareHomeStream({
  accessLevel,
  operatorName,
  dashboard,
  allowed,
  scope,
  scopedOrders,
  pendingQuotations,
  followUpQuotations,
  waitingClientOrders,
  activeCommercialOrders,
  teamOrders,
  pendingDeliveries,
  teamMembers,
}: Props) {
  const voiceInput = scopeVoiceInputForHome(dashboard, accessLevel);
  const attention = filterAttentionForHome(dashboard.attention, accessLevel);
  const copy = getRoleHomePanelCopy(accessLevel);
  const scopeNote = scopeEmptyReason(scope);
  const showWallet = !!allowed && setHasAny(allowed, ["me.wallet"] as Permission[]);

  const kpiMetrics = buildRoleKpiMetrics(accessLevel, {
    kpis: dashboard.kpis,
    scopedOrders,
    pendingQuotations,
    teamMembers,
    shootsToday: dashboard.schedule.todayShoots.length,
    showWallet,
  });

  const recentCopy = recentOrdersCopy(accessLevel);

  return (
    <WelcomeGate dashboard={voiceInput}>
      <div className="soda-founder-home flex min-h-0 min-w-0 flex-col gap-3">
        <section
          aria-label="Command overview"
          className="soda-founder-screen-1 soda-stagger-children"
        >
          <div className="soda-founder-hero-row soda-founder-hero-block">
            <FounderCommandHeader
              dashboard={voiceInput}
              operatorName={operatorName}
            />
            <FounderLiveClock className="shrink-0 self-start" />
          </div>

          {scopeNote ? (
            <p className="text-sm text-muted-foreground">{scopeNote}</p>
          ) : null}

          <RoleAwareKpiRow metrics={kpiMetrics} />
        </section>

        {accessLevel === "account_manager" ? (
          <>
            <section
              aria-label="Operational panels"
              className="soda-founder-ops-row soda-stagger-children grid min-h-0 gap-3 lg:grid-cols-3"
            >
              <HomePanelCard
                title={copy.ops1.title}
                layer={copy.ops1.layer}
                href="/quotations"
                isEmpty={pendingQuotations.length === 0}
                emptyMessage="No pending quotations in your scope."
              >
                <QuotationLines
                  quotations={pendingQuotations}
                  empty="No pending quotations."
                />
              </HomePanelCard>
              <HomePanelCard
                title={copy.ops2.title}
                layer={copy.ops2.layer}
                href="/quotations"
                isEmpty={followUpQuotations.length === 0}
                emptyMessage="No client follow-ups waiting."
              >
                <QuotationLines
                  quotations={followUpQuotations}
                  empty="No follow-ups."
                />
              </HomePanelCard>
              <HomePanelCard
                title={copy.ops3.title}
                layer={copy.ops3.layer}
                href="/orders"
                isEmpty={activeCommercialOrders.length === 0}
                emptyMessage="No active commercial orders in your scope."
              >
                <OrderLines
                  orders={activeCommercialOrders}
                  empty="No active orders."
                />
              </HomePanelCard>
            </section>

            <section
              aria-label="Management panels"
              className="soda-founder-mgmt-row soda-stagger-children grid min-h-0 gap-3 lg:grid-cols-3"
            >
              <HomePanelCard
                title={copy.mgmt1.title}
                layer={copy.mgmt1.layer}
                href="/clients"
                isEmpty={waitingClientOrders.length === 0}
                emptyMessage="No clients waiting on a response."
              >
                <OrderLines
                  orders={waitingClientOrders}
                  empty="No waiting clients."
                />
              </HomePanelCard>
              <div className="min-h-[12rem]">
                <UpcomingScheduleCard schedule={dashboard.schedule} />
              </div>
              <RoleAwareQuickActionsPanel
                allowedPermissions={allowed}
                accessLevel={accessLevel}
              />
            </section>
          </>
        ) : null}

        {accessLevel === "team_leader" ? (
          <>
            <section
              aria-label="Operational panels"
              className="soda-founder-ops-row soda-stagger-children grid min-h-0 gap-3 lg:grid-cols-3"
            >
              <HomePanelCard
                title={copy.ops1.title}
                layer={copy.ops1.layer}
                href="/orders"
                isEmpty={teamOrders.length === 0}
                emptyMessage="No team orders in your scope."
              >
                <OrderLines orders={teamOrders} empty="No team orders." />
              </HomePanelCard>
              <HomePanelCard
                title={copy.ops2.title}
                layer={copy.ops2.layer}
                href="/calendar"
                isEmpty={dashboard.schedule.todayShoots.length === 0}
                emptyMessage="No shoots scheduled today for your team."
              >
                <ul className="divide-y divide-border/40">
                  {dashboard.schedule.todayShoots.slice(0, 5).map((s) => (
                    <li key={s.id}>
                      <Link
                        href={s.href || `/orders/${s.orderId}`}
                        className="block rounded-md px-1 py-1.5 text-sm hover:text-soda-pink"
                      >
                        {s.title} · {s.clientName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </HomePanelCard>
              <HomePanelCard
                title={copy.ops3.title}
                layer={copy.ops3.layer}
                href="/orders"
                isEmpty={pendingDeliveries.length === 0}
                emptyMessage="No pending deliveries on team work."
              >
                <OrderLines
                  orders={pendingDeliveries}
                  empty="No pending deliveries."
                />
              </HomePanelCard>
            </section>

            <section
              aria-label="Management panels"
              className="soda-founder-mgmt-row soda-stagger-children grid min-h-0 gap-3 lg:grid-cols-3"
            >
              {attention.length > 0 ? (
                <FounderNeedsDecision items={attention} limit={6} />
              ) : (
                <HomePanelCard
                  title={copy.mgmt1.title}
                  layer={copy.mgmt1.layer}
                  isEmpty
                  emptyMessage="No team items need your attention right now."
                >
                  <span />
                </HomePanelCard>
              )}
              <HomePanelCard
                title={copy.mgmt2.title}
                layer={copy.mgmt2.layer}
                href="/people"
                isEmpty={teamMembers === 0}
                emptyMessage="No crew linked to your team scope."
              >
                <p className="text-sm text-muted-foreground">
                  {teamMembers} team member{teamMembers === 1 ? "" : "s"} in
                  scope.
                </p>
              </HomePanelCard>
              <RoleAwareQuickActionsPanel
                allowedPermissions={allowed}
                accessLevel={accessLevel}
              />
            </section>
          </>
        ) : null}

        {accessLevel === "team" ? (
          <>
            <section
              aria-label="Operational panels"
              className="soda-founder-ops-row soda-stagger-children grid min-h-0 gap-3 lg:grid-cols-3"
            >
              <HomePanelCard
                title={copy.ops1.title}
                layer={copy.ops1.layer}
                href="/orders"
                isEmpty={scopedOrders.length === 0}
                emptyMessage="No assigned orders yet."
              >
                <OrderLines orders={scopedOrders} empty="No orders." />
              </HomePanelCard>
              <div className="min-h-[12rem]">
                <UpcomingScheduleCard schedule={dashboard.schedule} />
              </div>
              <HomePanelCard
                title={copy.ops3.title}
                layer={copy.ops3.layer}
                href="/orders"
                isEmpty={
                  scopedOrders.filter((o) => isOrderActiveWorkload(o.status))
                    .length === 0
                }
                emptyMessage="No active tasks assigned to you."
              >
                <OrderLines
                  orders={scopedOrders.filter((o) =>
                    isOrderActiveWorkload(o.status)
                  )}
                  empty="No active tasks."
                />
              </HomePanelCard>
            </section>

            <section
              aria-label="Management panels"
              className="soda-founder-mgmt-row soda-stagger-children grid min-h-0 gap-3 lg:grid-cols-3"
            >
              <div className="min-h-[12rem]">
                <TodayFocus dashboard={voiceInput} />
              </div>
              <WorkspacePlaceholder message="Personal workspace modules — wallet, files, and performance live in My Workspace." />
              <RoleAwareQuickActionsPanel
                allowedPermissions={allowed}
                accessLevel={accessLevel}
              />
            </section>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <Link
                href="/me/wallet"
                className="inline-flex items-center gap-1.5 hover:text-soda-pink"
              >
                <ClipboardList className="size-4" /> My Workspace
              </Link>
              <Link
                href="/notifications"
                className="inline-flex items-center gap-1.5 hover:text-soda-pink"
              >
                <Bell className="size-4" /> Notifications
              </Link>
              <Link
                href="/calendar"
                className="inline-flex items-center gap-1.5 hover:text-soda-pink"
              >
                <CalendarDays className="size-4" /> Calendar
              </Link>
            </div>
          </>
        ) : null}

        <section
          aria-label="Recent activity"
          className="soda-founder-lower-panels soda-stagger-children grid min-h-0 gap-3 lg:grid-cols-2"
        >
          <FounderRecentActivity
            orders={dashboard.recentOrders}
            limit={5}
            title={recentCopy.title}
            description={recentCopy.description}
          />
          <ScopedHomeUpdates scope={scope} />
        </section>
      </div>
    </WelcomeGate>
  );
}
