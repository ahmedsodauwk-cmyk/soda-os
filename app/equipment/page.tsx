import { AppShell } from "@/components/layout/app-shell";
import { EquipmentInventoryContent } from "@/components/equipment/equipment-inventory-content";
import { refreshEquipment } from "@/lib/equipment/repository";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  await refreshEquipment();
  return (
    <AppShell
      title="Equipment"
      subtitle="Inventory — cameras, lenses, and kit."
    >
      <EquipmentInventoryContent />
    </AppShell>
  );
}
