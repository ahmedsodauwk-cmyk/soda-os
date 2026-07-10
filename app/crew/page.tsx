import { AppShell } from "@/components/layout/app-shell";
import { CrewList } from "@/components/crew/crew-list";
import { getCrew, getCrewPerformance } from "@/lib/crew";
import { getModuleSlogan } from "@/lib/brand";

export default function CrewPage() {
  const crew = getCrew();
  const performanceById = Object.fromEntries(
    crew.map((m) => [m.id, getCrewPerformance(m.id)])
  );

  return (
    <AppShell title="The Crew" subtitle={getModuleSlogan("crew")}>
      <CrewList crew={crew} performanceById={performanceById} />
    </AppShell>
  );
}
