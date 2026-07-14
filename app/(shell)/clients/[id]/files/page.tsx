import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { ClientFilesPanel } from "@/components/clients/client-files-panel";
import { ClientWorkspaceSectionPage } from "@/components/clients/client-workspace-section";
import { refreshClients } from "@/lib/clients/repository";
import { refreshFiles } from "@/lib/files/repository";
import { resolveSessionForApp } from "@/lib/identity/session";
import { refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function ClientFilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveSessionForApp();
  await Promise.all([refreshClients(), refreshProjects(), refreshFiles()]);

  const content = (
    <ClientWorkspaceSectionPage clientId={id} section="files">
      <ClientFilesPanel clientId={id} />
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
