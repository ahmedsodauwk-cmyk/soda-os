import { AppShell } from "@/components/layout/app-shell";
import { CalendarContent } from "@/components/calendar/calendar-content";
import {
  getAssignments,
  refreshAssignments,
} from "@/lib/assignments/repository";
import { getBusinessToday } from "@/lib/business/types";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { detectCrewScheduleConflicts } from "@/lib/calendar/conflicts";
import {
  getCalendarEvents,
  refreshCalendar,
} from "@/lib/calendar/repository";
import { getPeople, refreshPeople } from "@/lib/people/repository";
import { getProjects, refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await Promise.all([
    refreshCalendar(),
    refreshAssignments(),
    refreshPeople(),
    refreshProjects(),
  ]);
  const asOf = getBusinessToday();
  const events = getCalendarEvents();
  const conflicts = detectCrewScheduleConflicts();
  const peopleOptions = getPeople().map((p) => ({
    id: p.id,
    label: p.nickname || p.nameEn || p.nameAr,
  }));
  const projectOptions = getProjects().map((p) => ({
    id: p.id,
    label: p.name,
  }));

  const crewOrderMap: Record<string, string[]> = {};
  for (const a of getAssignments()) {
    const list = crewOrderMap[a.personId] ?? [];
    if (!list.includes(a.orderId)) list.push(a.orderId);
    crewOrderMap[a.personId] = list;
  }

  return (
    <AppShell title="الجدول" subtitle={getModuleSlogan("calendar")}>
      <CalendarContent
        events={events}
        asOf={asOf}
        conflicts={conflicts}
        peopleOptions={peopleOptions}
        projectOptions={projectOptions}
        crewOrderMap={crewOrderMap}
      />
    </AppShell>
  );
}
