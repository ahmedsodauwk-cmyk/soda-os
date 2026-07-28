import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { FounderHomeStream } from "@/components/dashboard/founder-home-stream";
import { HomeGreetingFirst } from "@/components/dashboard/home-greeting-first";
import { RoleAwareHomeStream } from "@/components/dashboard/role-aware-home-stream";
import { SkeletonDashboardHome } from "@/components/ui/soda-skeleton";
import { loadRoleHomeData } from "@/lib/dashboard/role-home-data";
import { permissionsForAsync } from "@/lib/identity/permission-service";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

/**
 * Command Center — one shared V3 Home shell for all Access Levels.
 * Founder keeps full company Command Center; others get scoped panels + data.
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

  if (!session || level === "founder") {
    return (
      <AppShell
        titleKey="pages.home"
        layer="dashboard"
        session={session}
        showBreadcrumbs={false}
        compactChrome
      >
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

  const roleData = await loadRoleHomeData(session);

  return (
    <AppShell
      titleKey="pages.home"
      layer="dashboard"
      session={session}
      showBreadcrumbs={false}
      compactChrome
    >
      <Suspense
        fallback={
          <>
            <HomeGreetingFirst operatorName={operatorName} />
            <SkeletonDashboardHome />
          </>
        }
      >
        <RoleAwareHomeStream
          accessLevel={roleData.accessLevel}
          operatorName={roleData.operatorName}
          dashboard={roleData.dashboard}
          allowed={allowed}
          scope={roleData.scope}
          scopedOrders={roleData.scopedOrders}
          pendingQuotations={roleData.pendingQuotations}
          followUpQuotations={roleData.followUpQuotations}
          waitingClientOrders={roleData.waitingClientOrders}
          activeCommercialOrders={roleData.activeCommercialOrders}
          teamOrders={roleData.teamOrders}
          pendingDeliveries={roleData.pendingDeliveries}
          teamMembers={roleData.teamMembers}
        />
      </Suspense>
    </AppShell>
  );
}
