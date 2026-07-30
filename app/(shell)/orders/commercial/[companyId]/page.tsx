import { AppShell } from "@/components/layout/app-shell";
import { CommercialCompanyOrders } from "@/components/orders/commercial-company-orders";
import { isFounderAccess, permissionsForAccessLevel } from "@/lib/identity/access-levels";
import { homePathForAccessLevel } from "@/lib/identity/nav";
import { resolveSessionForApp } from "@/lib/identity/session";
import { refreshClients } from "@/lib/clients/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshPayments } from "@/lib/payments/repository";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CommercialCompanyOrdersPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const session = await resolveSessionForApp();
  if (session && !isFounderAccess(session.profile.accessLevel)) {
    const grants = permissionsForAccessLevel(session.profile.accessLevel);
    redirect(homePathForAccessLevel(session.profile.accessLevel, grants));
  }

  const { companyId } = await params;
  await Promise.all([refreshClients(), refreshOrders(), refreshPayments()]);
  return (
    <AppShell titleKey="pages.commercialOrders" layer="commercialOrders">
      <CommercialCompanyOrders companyId={companyId} />
    </AppShell>
  );
}
