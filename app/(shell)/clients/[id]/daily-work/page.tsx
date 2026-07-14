import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { ClientDailyWorkPanel } from "@/components/clients/client-daily-work-panel";
import { ClientWorkspaceSectionPage } from "@/components/clients/client-workspace-section";
import { refreshClients } from "@/lib/clients/repository";
import { resolveSessionForApp } from "@/lib/identity/session";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function ClientDailyWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveSessionForApp();
  await Promise.all([refreshClients(), refreshOrders(), refreshProjects()]);

  const content = (
    <ClientWorkspaceSectionPage clientId={id} section="daily-work">
      <ClientDailyWorkPanel clientId={id} />
    </ClientWorkspaceSectionPage>
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
