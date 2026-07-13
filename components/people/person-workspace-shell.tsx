import { notFound } from "next/navigation";

import { BackLink } from "@/components/navigation/back-link";
import { PersonWorkspaceHeader } from "@/components/people/person-workspace-header";
import { PersonWorkspaceNav } from "@/components/people/person-workspace-nav";
import { fetchPersonById } from "@/lib/people/repository";
import {
  PEOPLE_WORKSPACE_TREE,
  type PeopleWorkspaceSectionId,
} from "@/lib/people/workspace";

interface PersonWorkspaceShellProps {
  personId: string;
  section: PeopleWorkspaceSectionId;
  children: React.ReactNode;
}

/**
 * People OS chrome: real person header + section nav + body.
 */
export async function PersonWorkspaceShell({
  personId,
  section,
  children,
}: PersonWorkspaceShellProps) {
  const person = await fetchPersonById(personId);
  if (!person) notFound();

  const meta = PEOPLE_WORKSPACE_TREE.find((s) => s.id === section);
  if (!meta) notFound();

  return (
    <div className="space-y-6">
      <BackLink href="/people" label="People" />
      <PersonWorkspaceHeader person={person} />
      <PersonWorkspaceNav personId={personId} active={section} />
      <div className="space-y-2">
        <h3 className="font-heading text-base font-semibold">{meta.label}</h3>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </div>
      {children}
    </div>
  );
}
