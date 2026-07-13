import { notFound } from "next/navigation";

import { PersonAvatar } from "@/components/business/person-avatar";
import { CrewDashboardPanel } from "@/components/people/crew-dashboard-panel";
import { Badge } from "@/components/ui/badge";
import {
  EMPLOYMENT_TYPE_LABELS,
  fetchPersonById,
} from "@/lib/people";
import { PERSON_STATUSES } from "@/lib/people/types";

interface PersonOverviewPanelProps {
  personId: string;
  canEdit?: boolean;
}

/** Crew Workspace dashboard — operational status + interactive identity. */
export async function PersonOverviewPanel({
  personId,
  canEdit = false,
}: PersonOverviewPanelProps) {
  const person = await fetchPersonById(personId);
  if (!person) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar
          nameAr={person.nameAr}
          nameEn={person.nameEn}
          initials={person.initials}
          avatarUrl={person.avatarUrl}
          size="lg"
        />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Profile photo</p>
          <p className="text-xs text-muted-foreground">
            {person.avatarUrl
              ? "Photo on file"
              : "No photo yet — empty until Founder adds a URL/path"}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {person.jobTitle ? (
              <Badge variant="outline">{person.jobTitle}</Badge>
            ) : null}
            {PERSON_STATUSES.includes(person.status) ? (
              <Badge variant="outline" className="capitalize">
                {person.status.replace("_", " ")}
              </Badge>
            ) : null}
            {person.employmentType ? (
              <Badge variant="secondary">
                {EMPLOYMENT_TYPE_LABELS[person.employmentType]}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <CrewDashboardPanel person={person} canEdit={canEdit} />
    </div>
  );
}
