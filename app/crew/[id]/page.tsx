import { AppShell } from "@/components/layout/app-shell";
import { CrewProfile } from "@/components/crew/crew-profile";
import { refreshCrewProfileDomainData } from "@/lib/supabase/refresh-all";

export const dynamic = "force-dynamic";

interface CrewMemberPageProps {
  params: Promise<{ id: string }>;
}

export default async function CrewMemberPage({ params }: CrewMemberPageProps) {
  const { id } = await params;
  // Lean refresh — people/orders/assignments/equipment only (not full domain).
  await refreshCrewProfileDomainData();

  return (
    <AppShell titleKey="pages.crewProfile" layer="crewProfile">
      <CrewProfile personId={id} />
    </AppShell>
  );
}
