import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  isScheduleSectionKey,
  ScheduleSectionList,
  SCHEDULE_SECTION_META,
  type ScheduleSectionKey,
} from "@/components/dashboard/schedule-section-list";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { loadScopedDashboardSnapshot } from "@/lib/dashboard/scoped-snapshot";
import type { ScheduleItem, UpcomingSchedule } from "@/lib/dashboard/types";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

function itemsForSection(
  schedule: UpcomingSchedule,
  section: ScheduleSectionKey
): ScheduleItem[] {
  switch (section) {
    case "today":
      return schedule.todayShoots;
    case "tomorrow":
      return schedule.tomorrowShoots;
    case "deliveries":
      return schedule.deliveries;
    case "deadlines":
      return schedule.deadlines;
  }
}

export default async function ScheduleSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: raw } = await params;
  if (!isScheduleSectionKey(raw)) notFound();

  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const { dashboard } = await loadScopedDashboardSnapshot(session);
  const items = itemsForSection(dashboard.schedule, raw);
  const meta = SCHEDULE_SECTION_META[raw];

  return (
    <AppShell title={meta.title} layer="schedule" session={session}>
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="cursor-pointer"
          nativeButton={false}
          render={<Link href="/" />}
        >
          ← Home Screen
        </Button>
        <ScheduleSectionList section={raw} items={items} />
      </div>
    </AppShell>
  );
}
