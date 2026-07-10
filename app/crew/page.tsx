import { AppShell } from "@/components/layout/app-shell";
import { CrewList } from "@/components/crew/crew-list";
import { getCrew, getCrewPerformance } from "@/lib/crew";

export default function CrewPage() {
  const crew = getCrew();
  const performanceById = Object.fromEntries(
    crew.map((m) => [m.id, getCrewPerformance(m.id)])
  );

  return (
    <AppShell
      title="The Crew"
      subtitle="Operational database — roles, equipment, assignments, and pay."
    >
      <CrewList crew={crew} performanceById={performanceById} />
    </AppShell>
  );
}
