import { AppShell } from "@/components/layout/app-shell";
import { ClientWorkspaceSectionPage } from "@/components/clients/client-workspace-section";
import { refreshClients } from "@/lib/clients/repository";

export const dynamic = "force-dynamic";

export default async function ClientPartnershipHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await refreshClients();
  return (
    <AppShell titleKey="pages.client" layer="clients">
      <ClientWorkspaceSectionPage clientId={id} section="partnership-history" />
    </AppShell>
  );
}
