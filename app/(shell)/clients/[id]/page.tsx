import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { ClientOverviewPanel } from "@/components/clients/client-overview-panel";
import { ClientWorkspaceNav } from "@/components/clients/client-workspace-nav";
import { refreshClients } from "@/lib/clients/repository";
import { refreshBusinessEventsFromDb } from "@/lib/core";
import { refreshExpenses } from "@/lib/finance/expenses";
import { resolveSessionForApp } from "@/lib/identity/session";
import { refreshInvoices } from "@/lib/invoices/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshPayments } from "@/lib/payments/repository";
import { refreshProjects } from "@/lib/projects/repository";
import { refreshQuotations } from "@/lib/quotations/repository";

export const dynamic = "force-dynamic";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveSessionForApp();

  await Promise.all([
    refreshClients(),
    refreshProjects(),
    refreshOrders(),
    refreshPayments(),
    refreshQuotations(),
    refreshInvoices(),
    refreshExpenses().catch(() => []),
    refreshBusinessEventsFromDb(120).catch(() => []),
  ]);

  const content = (
    <div className="space-y-6">
      <ClientWorkspaceNav clientId={id} active="overview" />
      <ClientOverviewPanel clientId={id} />
    </div>
  );

  return (
    <AppShell titleKey="pages.client" layer="clients" session={session}>
      {session ? (
        <RoleGate session={session} anyOf={["clients.view"]}>
          {content}
        </RoleGate>
      ) : (
        content
      )}
    </AppShell>
  );
}
