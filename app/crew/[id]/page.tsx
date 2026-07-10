import { AppShell } from "@/components/layout/app-shell";
import { CrewProfile } from "@/components/crew/crew-profile";

interface CrewMemberPageProps {
  params: Promise<{ id: string }>;
}

export default async function CrewMemberPage({ params }: CrewMemberPageProps) {
  const { id } = await params;

  return (
    <AppShell title="The Crew" subtitle="Member profile">
      <CrewProfile personId={id} />
    </AppShell>
  );
}
