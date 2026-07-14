import { AppShell } from "@/components/layout/app-shell";
import { CalendarContent } from "@/components/calendar/calendar-content";
import { RoleGate } from "@/components/identity/role-gate";
import {
  getAssignments,
  refreshAssignments,
} from "@/lib/assignments/repository";
import { getBusinessToday } from "@/lib/business/types";
import { detectCrewScheduleConflicts } from "@/lib/calendar/conflicts";
import {
  getCalendarEvents,
  refreshCalendar,
} from "@/lib/calendar/repository";
import { getClients } from "@/lib/clients/repository";
import {
  buildDataScope,
  scopeEmptyReason,
  type DataScope,
} from "@/lib/identity/data-scope";
import { resolveSessionForApp } from "@/lib/identity/session";
import { getOrders, refreshOrders } from "@/lib/orders/repository";
import { getPeople, refreshPeople } from "@/lib/people/repository";
import { getProjects, refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await resolveSessionForApp();
  await Promise.all([
    refreshCalendar(),
    refreshAssignments(),
    refreshPeople(),
    refreshProjects(),
    refreshOrders(),
  ]);
  const asOf = getBusinessToday();
  let events = getCalendarEvents();
  let conflicts = detectCrewScheduleConflicts();
  let people = getPeople();
  let projects = getProjects();
  let note: string | null = null;
  let scope: DataScope | null = null;

  if (session && session.profile.accessLevel !== "founder") {
    scope = buildDataScope(session, {
      orders: getOrders(),
      clients: getClients(),
    });
    note = scopeEmptyReason(scope);
    if (scope.orderIds) {
      events = events.filter(
        (e) => !e.orderId || scope!.orderIds!.has(e.orderId)
      );
      conflicts = conflicts.filter((c) =>
        c.orderIds.some((id) => scope!.orderIds!.has(id))
      );
    }
    if (scope.personIds) {
      people = people.filter((p) => scope!.personIds!.has(p.id));
    }
    if (scope.clientIds) {
      projects = projects.filter((p) => scope!.clientIds!.has(p.clientId));
    }
  }

  const peopleOptions = people.map((p) => ({
    id: p.id,
    label: p.nickname || p.nameEn || p.nameAr,
  }));
  const projectOptions = projects.map((p) => ({
    id: p.id,
    label: p.name,
  }));

  const crewOrderMap: Record<string, string[]> = {};
  for (const a of getAssignments()) {
    if (scope?.personIds && !scope.personIds.has(a.personId)) continue;
    if (scope?.orderIds && !scope.orderIds.has(a.orderId)) continue;
    const list = crewOrderMap[a.personId] ?? [];
    if (!list.includes(a.orderId)) list.push(a.orderId);
    crewOrderMap[a.personId] = list;
  }

  const body = (
    <>
      {note ? (
        <p className="mb-4 text-sm text-muted-foreground">{note}</p>
      ) : null}
      <CalendarContent
        events={events}
        asOf={asOf}
        conflicts={conflicts}
        peopleOptions={peopleOptions}
        projectOptions={projectOptions}
        crewOrderMap={crewOrderMap}
      />
    </>
  );

  return (
    <AppShell titleKey="pages.calendar" layer="calendar" session={session}>
      {session ? (
        <RoleGate session={session} anyOf={["calendar.view"]} path="/calendar">
          {body}
        </RoleGate>
      ) : (
        body
      )}
    </AppShell>
  );
}
