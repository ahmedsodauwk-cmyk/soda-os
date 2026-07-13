import { AppShell } from "@/components/layout/app-shell";
import { ClientWorkspaceSectionPage } from "@/components/clients/client-workspace-section";
import { refreshClients } from "@/lib/clients/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function ClientTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await Promise.all([refreshClients(), refreshOrders(), refreshProjects()]);
  return (
    <AppShell titleKey="pages.client" layer="clients">
      <ClientWorkspaceSectionPage clientId={id} section="timeline" />
    </AppShell>
  );
}
