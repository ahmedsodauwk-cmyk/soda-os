import { AppShell } from "@/components/layout/app-shell";
import { CommercialOrdersView } from "@/components/orders/commercial-orders-view";
import { isFounderAccess, permissionsForAccessLevel } from "@/lib/identity/access-levels";
import { homePathForAccessLevel } from "@/lib/identity/nav";
import { resolveSessionForApp } from "@/lib/identity/session";
import { refreshClients } from "@/lib/clients/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshPayments } from "@/lib/payments/repository";
import { refreshProjects } from "@/lib/projects/repository";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CommercialOrdersPage() {
  const session = await resolveSessionForApp();
  if (session && !isFounderAccess(session.profile.accessLevel)) {
    const grants = permissionsForAccessLevel(session.profile.accessLevel);
    redirect(homePathForAccessLevel(session.profile.accessLevel, grants));
  }

  await Promise.all([
    refreshClients(),
    refreshProjects(),
    refreshOrders(),
    refreshPayments(),
  ]);
  return (
    <AppShell titleKey="pages.commercialOrders" layer="commercialOrders">
      <CommercialOrdersView />
    </AppShell>
  );
}
