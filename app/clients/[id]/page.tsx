import { AppShell } from "@/components/layout/app-shell";
import { ClientProfile } from "@/components/clients/client-profile";
import { ClientWorkspaceNav } from "@/components/clients/client-workspace-nav";
import { refreshClients } from "@/lib/clients/repository";
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
  await Promise.all([
    refreshClients(),
    refreshProjects(),
    refreshOrders(),
    refreshPayments(),
    refreshQuotations(),
  ]);
  return (
    <AppShell titleKey="pages.client" layer="clients">
      <div className="space-y-6">
        <ClientWorkspaceNav clientId={id} active="overview" />
        <ClientProfile clientId={id} />
      </div>
    </AppShell>
  );
}
