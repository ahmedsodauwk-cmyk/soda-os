import Link from "next/link";

import { PeopleEmptyState } from "@/components/people/people-empty-state";
import { Badge } from "@/components/ui/badge";
import {
  buildCrewTimeline,
  crewTimelineKindLabel,
} from "@/lib/people/timeline";
import type { Person } from "@/lib/people/types";

interface PersonActivityTimelineProps {
  person: Person;
}

export function PersonActivityTimeline({
  person,
}: PersonActivityTimelineProps) {
  const items = buildCrewTimeline(person, 50);

  if (items.length === 0) {
    return (
      <PeopleEmptyState
        title="Timeline empty"
        detail="Assigned orders, payments, bonuses, and profile updates appear here from real studio events — never invented."
      />
    );
  }

  return (
    <ol className="relative space-y-0 border-s border-border/60 ms-2">
      {items.map((item) => {
        const body = (
          <div className="ms-4 space-y-1 pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{crewTimelineKindLabel(item.kind)}</Badge>
              <time className="text-xs text-muted-foreground">
                {item.occurredAt.slice(0, 16).replace("T", " ")}
              </time>
            </div>
            <p className="text-sm font-medium">{item.title}</p>
            {item.detail ? (
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            ) : null}
          </div>
        );
        return (
          <li key={item.id} className="relative">
            <span
              aria-hidden
              className="absolute -start-[5px] top-1.5 size-2.5 rounded-full bg-primary/70"
            />
            {item.href ? (
              <Link
                href={item.href}
                className="block rounded-md transition-colors hover:bg-muted/40"
              >
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ol>
  );
}
