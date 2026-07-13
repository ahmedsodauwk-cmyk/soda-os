import { notFound } from "next/navigation";

import { PersonAvatar } from "@/components/business/person-avatar";
import { PeopleEmptyState } from "@/components/people/people-empty-state";
import { Badge } from "@/components/ui/badge";
import {
  EMPLOYMENT_TYPE_LABELS,
  fetchPersonById,
  type Person,
} from "@/lib/people";
import { PERSON_STATUSES } from "@/lib/people/types";

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const filled = Boolean(value?.trim());
  return (
    <div className="space-y-1 rounded-xl border border-border/50 bg-card/30 px-3.5 py-3">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className={filled ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
        {filled ? value : "— empty until recorded"}
      </p>
    </div>
  );
}

function emergencyLine(person: Person): string | null {
  const name = person.emergencyContactName?.trim();
  const phone = person.emergencyContactPhone?.trim();
  if (!name && !phone) return null;
  return [name, phone].filter(Boolean).join(" · ");
}

interface PersonOverviewPanelProps {
  personId: string;
}

export async function PersonOverviewPanel({
  personId,
}: PersonOverviewPanelProps) {
  const person = await fetchPersonById(personId);
  if (!person) notFound();

  const fullName =
    [person.nameEn, person.nameAr].filter((v) => v?.trim()).join(" / ") || null;

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
              : "No photo yet — empty until Founder adds one"}
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Full Name" value={fullName} />
        <Field
          label="Display Name"
          value={person.displayName || person.nickname}
        />
        <Field label="Position" value={person.jobTitle} />
        <Field label="Department" value={person.department} />
        <Field
          label="Employment Status"
          value={person.status?.replace("_", " ")}
        />
        <Field label="Phone" value={person.phone} />
        <Field label="Email" value={person.email} />
        <Field label="Emergency Contact" value={emergencyLine(person)} />
        <Field label="Join Date" value={person.joinDate} />
      </div>

      {!person.phone && !person.email && !person.department ? (
        <PeopleEmptyState
          title="Profile fields ready"
          detail="Schema and UI support the full People OS identity card. Values stay empty until the Founder records them — nothing is invented."
        />
      ) : null}
    </div>
  );
}
