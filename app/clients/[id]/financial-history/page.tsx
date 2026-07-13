import { AppShell } from "@/components/layout/app-shell";
import { ClientWorkspaceSectionPage } from "@/components/clients/client-workspace-section";
import { refreshClients } from "@/lib/clients/repository";
import { refreshPayments } from "@/lib/payments/repository";

export const dynamic = "force-dynamic";

export default async function ClientFinancialHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await Promise.all([refreshClients(), refreshPayments()]);
  return (
    <AppShell titleKey="pages.client" layer="clients">
      <ClientWorkspaceSectionPage clientId={id} section="financial-history" />
    </AppShell>
  );
}
