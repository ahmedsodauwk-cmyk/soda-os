import { AppShell } from "@/components/layout/app-shell";
import { PeopleList } from "@/components/people/people-list";
import { getPeople, getPersonPerformance } from "@/lib/people/repository";

export default function PeoplePage() {
  const people = getPeople();
  const performanceById = Object.fromEntries(
    people.map((p) => [p.id, getPersonPerformance(p.id)])
  );

  return (
    <AppShell
      title="People"
      subtitle="Profiles, equipment, and order-based pay — no manual salaries."
    >
      <PeopleList people={people} performanceById={performanceById} />
    </AppShell>
  );
}
