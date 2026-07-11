import { AppShell } from "@/components/layout/app-shell";
import { CalendarContent } from "@/components/calendar/calendar-content";
import { getBusinessToday } from "@/lib/business/types";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import {
  getCalendarEvents,
  refreshCalendar,
} from "@/lib/calendar/repository";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await refreshCalendar();
  const asOf = getBusinessToday();
  const events = getCalendarEvents();

  return (
    <AppShell title="Calendar" subtitle={getModuleSlogan("calendar")}>
      <CalendarContent events={events} asOf={asOf} />
    </AppShell>
  );
}
