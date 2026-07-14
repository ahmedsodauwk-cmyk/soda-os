import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { PeopleDirectory } from "@/components/people/people-directory";
import { refreshAssignments } from "@/lib/assignments/repository";
import { getClients } from "@/lib/clients/repository";
import {
  buildDataScope,
  scopeEmptyReason,
  scopePeople,
} from "@/lib/identity/data-scope";
import { can } from "@/lib/identity/permissions";
import { resolveSessionForApp } from "@/lib/identity/session";
import { getOrders, refreshOrders } from "@/lib/orders/repository";
import {
  getAllPeople,
  getPersonPerformance,
  refreshPeople,
} from "@/lib/people/repository";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const session = await resolveSessionForApp();
  await Promise.all([
    refreshPeople(),
    refreshOrders(),
    refreshAssignments(),
  ]);

  const allPeople = getAllPeople();
  let people = allPeople;
  let note: string | null = null;

  if (session) {
    const scope = buildDataScope(session, {
      orders: getOrders(),
      clients: getClients(),
    });
    people = scopePeople(allPeople, scope);
    note = scopeEmptyReason(scope);
  }

  const performanceById = Object.fromEntries(
    people.map((m) => [m.id, getPersonPerformance(m.id)])
  );
  const canEdit = session
    ? can(session.profile.accessLevel, "people.edit") ||
      can(session.profile.accessLevel, "crew.edit")
    : false;

  const content = (
    <>
      {note ? (
        <p className="mb-4 text-sm text-muted-foreground">{note}</p>
      ) : null}
      <PeopleDirectory
        people={people}
        performanceById={performanceById}
        canEdit={canEdit && session?.profile.accessLevel === "founder"}
      />
    </>
  );

  return (
    <AppShell titleKey="pages.people" layer="people" session={session}>
      {session ? (
        <RoleGate
          session={session}
          anyOf={["people.view", "crew.view", "crew.stats"]}
          path="/people"
        >
          {content}
        </RoleGate>
      ) : (
        content
      )}
    </AppShell>
  );
}
