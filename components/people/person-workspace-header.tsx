import type { Person } from "@/lib/people/types";
import { PERSON_STATUSES } from "@/lib/people/types";
import { Badge } from "@/components/ui/badge";
import { PersonAvatar } from "@/components/business/person-avatar";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/people/types";

interface PersonWorkspaceHeaderProps {
  person: Person;
}

function displayLabel(person: Person): string {
  return (
    person.displayName?.trim() ||
    person.nickname?.trim() ||
    person.nameEn?.trim() ||
    person.nameAr?.trim() ||
    "Member"
  );
}

/** Workspace hero for a real person — no invented KPIs. */
export function PersonWorkspaceHeader({ person }: PersonWorkspaceHeaderProps) {
  const title = displayLabel(person);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background via-background to-primary/[0.06] p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start gap-4">
        <PersonAvatar
          nameAr={person.nameAr}
          nameEn={person.nameEn}
          initials={person.initials}
          avatarUrl={person.avatarUrl}
          size="lg"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-primary/80 uppercase">
            SODA VISUALS · People OS
          </p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
          </h2>
          {person.nameAr ? (
            <p className="font-ar text-base text-muted-foreground" dir="rtl">
              {person.nameAr}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {person.jobTitle ? (
              <Badge variant="outline">{person.jobTitle}</Badge>
            ) : null}
            {person.department ? (
              <Badge variant="secondary">{person.department}</Badge>
            ) : null}
            {person.employmentType ? (
              <Badge variant="secondary">
                {EMPLOYMENT_TYPE_LABELS[person.employmentType]}
              </Badge>
            ) : null}
            {PERSON_STATUSES.includes(person.status) ? (
              <Badge variant="outline" className="capitalize">
                {person.status.replace("_", " ")}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Personal operational workspace — not a generic user record.
          </p>
        </div>
      </div>
    </div>
  );
}
