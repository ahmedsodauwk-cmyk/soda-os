import { AppShell } from "@/components/layout/app-shell";
import { WeddingOrdersView } from "@/components/orders/wedding-orders-view";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default function WeddingOrdersPage() {
  return (
    <AppShell title="Wedding Orders" subtitle={getModuleSlogan("weddings")}>
      <WeddingOrdersView />
    </AppShell>
  );
}
