import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { EquipmentInventoryContent } from "@/components/equipment/equipment-inventory-content";
import { refreshEquipment } from "@/lib/equipment/repository";
import { resolveSessionForApp } from "@/lib/identity/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");
  await refreshEquipment();
  return (
    <AppShell titleKey="pages.equipment" layer="equipment" session={session}>
      <RoleGate
        session={session}
        anyOf={["equipment.view"]}
        path="/equipment"
      >
        <EquipmentInventoryContent />
      </RoleGate>
    </AppShell>
  );
}
