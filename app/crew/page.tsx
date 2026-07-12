import { AppShell } from "@/components/layout/app-shell";
import { CrewList } from "@/components/crew/crew-list";
import { getCrew, getCrewPerformance, refreshCrew } from "@/lib/crew";

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  await refreshCrew();
  const crew = getCrew();
  const performanceById = Object.fromEntries(
    crew.map((m) => [m.id, getCrewPerformance(m.id)])
  );

  return (
    <AppShell titleKey="pages.crew" layer="crew">
      <CrewList crew={crew} performanceById={performanceById} />
    </AppShell>
  );
}
