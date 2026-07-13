import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { PersonSectionEmpty } from "@/components/people/person-section-empty";
import { PersonOrdersPanel } from "@/components/people/person-orders-panel";
import {
  PersonPerformancePanel,
  PersonWalletPanel,
} from "@/components/people/person-ops-panels";
import { PersonWorkspaceShell } from "@/components/people/person-workspace-shell";
import { resolveSessionForApp } from "@/lib/identity/session";
import type { PeopleWorkspaceSectionId } from "@/lib/people/workspace";
import { refreshCrewProfileDomainData } from "@/lib/supabase/refresh-all";

export const dynamic = "force-dynamic";

async function PeopleSectionPage({
  personId,
  section,
  children,
}: {
  personId: string;
  section: PeopleWorkspaceSectionId;
  children: ReactNode;
}) {
  const session = await resolveSessionForApp();
  await refreshCrewProfileDomainData();

  const content = (
    <PersonWorkspaceShell personId={personId} section={section}>
      {children}
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

export function makePeopleSectionPage(
  section: PeopleWorkspaceSectionId,
  body: (personId: string) => ReactNode
) {
  return async function Page({
    params,
  }: {
    params: Promise<{ id: string }>;
  }) {
    const { id } = await params;
    return (
      <PeopleSectionPage personId={id} section={section}>
        {body(id)}
      </PeopleSectionPage>
    );
  };
}

export const AssignedOrdersPage = makePeopleSectionPage(
  "assigned-orders",
  (id) => <PersonOrdersPanel personId={id} mode="assigned" />
);

export const CompletedOrdersPage = makePeopleSectionPage(
  "completed-orders",
  (id) => <PersonOrdersPanel personId={id} mode="completed" />
);

export const CalendarPage = makePeopleSectionPage("calendar", () => (
  <PersonSectionEmpty section="calendar" />
));

export const TasksPage = makePeopleSectionPage("tasks", () => (
  <PersonSectionEmpty section="tasks" />
));

export const WalletPage = makePeopleSectionPage("wallet", (id) => (
  <PersonWalletPanel personId={id} />
));

export const BonusesPage = makePeopleSectionPage("bonuses", () => (
  <PersonSectionEmpty section="bonuses" />
));

export const PenaltiesPage = makePeopleSectionPage("penalties", () => (
  <PersonSectionEmpty section="penalties" />
));

export const AttendancePage = makePeopleSectionPage("attendance", () => (
  <PersonSectionEmpty section="attendance" />
));

export const PerformancePage = makePeopleSectionPage("performance", (id) => (
  <PersonPerformancePanel personId={id} />
));

export const NotificationsPage = makePeopleSectionPage("notifications", () => (
  <PersonSectionEmpty section="notifications" />
));

export const FilesPage = makePeopleSectionPage("files", () => (
  <PersonSectionEmpty section="files" />
));

export const ActivityPage = makePeopleSectionPage("activity", () => (
  <PersonSectionEmpty section="activity" />
));
