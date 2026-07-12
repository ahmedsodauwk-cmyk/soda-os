import { AppShell } from "@/components/layout/app-shell";
import { CrewProfile } from "@/components/crew/crew-profile";
import { getModuleSlogan } from "@/lib/brand";
import { refreshCrew } from "@/lib/crew";
import { refreshEquipment } from "@/lib/equipment/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshAssignments } from "@/lib/assignments/repository";

export const dynamic = "force-dynamic";

interface CrewMemberPageProps {
  params: Promise<{ id: string }>;
}

export default async function CrewMemberPage({ params }: CrewMemberPageProps) {
  const { id } = await params;
  await Promise.all([
    refreshCrew(),
    refreshEquipment(),
    refreshOrders(),
    refreshAssignments(),
  ]);

  return (
    <AppShell title="الفريق" subtitle={getModuleSlogan("crewProfile")}>
      <CrewProfile personId={id} />
    </AppShell>
  );
}
