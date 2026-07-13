import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { PeopleDirectory } from "@/components/people/people-directory";
import { can } from "@/lib/identity/permissions";
import { resolveSessionForApp } from "@/lib/identity/session";
import {
  getAllPeople,
  getPersonPerformance,
  refreshPeople,
} from "@/lib/people/repository";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const session = await resolveSessionForApp();
  await refreshPeople();
  const people = getAllPeople();
  const performanceById = Object.fromEntries(
    people.map((m) => [m.id, getPersonPerformance(m.id)])
  );
  const canEdit = session
    ? can(session.profile.role, "people.edit") ||
      can(session.profile.role, "crew.edit")
    : false;

  const content = (
    <PeopleDirectory
      people={people}
      performanceById={performanceById}
      canEdit={canEdit}
    />
  );

  return (
    <AppShell titleKey="pages.people" layer="people" session={session}>
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
