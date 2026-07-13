import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { ClientNotesEditor } from "@/components/clients/client-notes-editor";
import { ClientWorkspaceSectionPage } from "@/components/clients/client-workspace-section";
import { getClientNotes } from "@/lib/clients/aggregators";
import { refreshClients } from "@/lib/clients/repository";
import { can } from "@/lib/identity/permissions";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function ClientNotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveSessionForApp();
  await refreshClients();
  const notes = getClientNotes(id);
  if (!notes) notFound();

  const canEdit = session
    ? can(session.profile.role, "clients.edit")
    : true;

  const content = (
    <ClientWorkspaceSectionPage clientId={id} section="notes">
      <ClientNotesEditor
        clientId={id}
        initialNotes={notes.notes}
        canEdit={canEdit}
      />
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
