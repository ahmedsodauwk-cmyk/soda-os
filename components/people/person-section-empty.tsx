import { PeopleEmptyState } from "@/components/people/people-empty-state";
import {
  PEOPLE_WORKSPACE_TREE,
  type PeopleWorkspaceSectionId,
} from "@/lib/people/workspace";

interface PersonSectionEmptyProps {
  section: PeopleWorkspaceSectionId;
}

/** Default honest shell for sections without live feed data yet. */
export function PersonSectionEmpty({ section }: PersonSectionEmptyProps) {
  const meta = PEOPLE_WORKSPACE_TREE.find((s) => s.id === section);
  if (!meta) return null;

  return (
    <PeopleEmptyState
      title={meta.emptyTitle}
      detail={meta.emptyDetail}
      hint={`Shell ready for: ${meta.owns}`}
    />
  );
}
