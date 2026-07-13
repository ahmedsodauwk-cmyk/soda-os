import Link from "next/link";

import { InteractiveProfileCards } from "@/components/people/interactive-profile-cards";
import { PeopleEmptyState } from "@/components/people/people-empty-state";
import { Badge } from "@/components/ui/badge";
import { getCrewDashboardSnapshot } from "@/lib/people/dashboard";
import { fetchLinkedRoleForPerson } from "@/lib/people/actions";
import type { Person } from "@/lib/people/types";
import { peopleWorkspaceHref } from "@/lib/people/workspace";

function StatCard({
  label,
  value,
  href,
  empty,
}: {
  label: string;
  value: string;
  href?: string;
  empty?: boolean;
}) {
  const body = (
    <div className="space-y-1 rounded-xl border border-border/50 bg-card/40 px-3.5 py-3 transition-colors hover:border-primary/30">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={
          empty
            ? "text-sm text-muted-foreground"
            : "font-mono text-lg font-semibold"
        }
      >
        {value}
      </p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}

interface CrewDashboardPanelProps {
  person: Person;
  canEdit: boolean;
}

export async function CrewDashboardPanel({
  person,
  canEdit,
}: CrewDashboardPanelProps) {
  const snap = getCrewDashboardSnapshot(person);
  const link = await fetchLinkedRoleForPerson(person.id);
  const perf = snap.performance;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Current Orders"
          value={
            snap.currentOrders.length
              ? String(snap.currentOrders.length)
              : "None"
          }
          empty={snap.currentOrders.length === 0}
          href={peopleWorkspaceHref(person.id, "assigned-orders")}
        />
        <StatCard
          label="Assigned Work"
          value={
            snap.assignedWork.length
              ? String(snap.assignedWork.length)
              : "None"
          }
          empty={snap.assignedWork.length === 0}
          href={peopleWorkspaceHref(person.id, "assigned-orders")}
        />
        <StatCard
          label="Pending Reviews"
          value={
            snap.pendingReviews.length
              ? String(snap.pendingReviews.length)
              : "None"
          }
          empty={snap.pendingReviews.length === 0}
        />
        <StatCard
          label="Attendance"
          value="No records yet"
          empty
          href={peopleWorkspaceHref(person.id, "attendance")}
        />
        <StatCard
          label="Performance"
          value={
            perf.ordersCompleted > 0 || perf.currentWorkload > 0
              ? `${perf.currentWorkload} load · ${perf.ordersCompleted} done`
              : "No signal yet"
          }
          empty={perf.ordersCompleted === 0 && perf.currentWorkload === 0}
          href={peopleWorkspaceHref(person.id, "performance")}
        />
        <StatCard
          label="Last Activity"
          value={
            snap.lastActivity
              ? snap.lastActivity.title
              : "No activity yet"
          }
          empty={!snap.lastActivity}
          href={peopleWorkspaceHref(person.id, "activity")}
        />
      </div>

      {snap.currentOrders.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Active assignments</h4>
          <ul className="space-y-2">
            {snap.currentOrders.slice(0, 5).map(({ assignment, order }) => (
              <li key={assignment.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm transition-colors hover:border-primary/35"
                >
                  <span>
                    {order.clientName} · {assignment.role}
                  </span>
                  <Badge variant="outline">{order.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <PeopleEmptyState
          title="No current orders"
          detail="Active order assignments appear here when this crew member is on real work — nothing is invented."
        />
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Identity</h4>
        <InteractiveProfileCards
          person={person}
          linkedRole={link.role}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
