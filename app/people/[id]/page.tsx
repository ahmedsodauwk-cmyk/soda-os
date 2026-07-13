import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { PersonOverviewPanel } from "@/components/people/person-overview-panel";
import { PersonWorkspaceShell } from "@/components/people/person-workspace-shell";
import { canSeeFounderActions } from "@/lib/people/access";
import { resolveSessionForApp } from "@/lib/identity/session";
import { refreshCrewProfileDomainData } from "@/lib/supabase/refresh-all";

export const dynamic = "force-dynamic";

export default async function PersonOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveSessionForApp();
  await refreshCrewProfileDomainData();

  const showFounderActions = canSeeFounderActions(session?.profile.role);
  const canEdit = showFounderActions;

  const content = (
    <PersonWorkspaceShell
      personId={id}
      section="overview"
      showFounderActions={showFounderActions}
    >
      <PersonOverviewPanel personId={id} canEdit={canEdit} />
    </PersonWorkspaceShell>
  );

  return (
    <AppShell
      titleKey="pages.peopleProfile"
      layer="peopleProfile"
      session={session}
    >
      {session ? (
        <RoleGate
          session={session}
          anyOf={["people.view", "crew.view", "crew.stats"]}
        >
          {content}
        </RoleGate>
      ) : (
        content
      )}
    </AppShell>
  );
}
