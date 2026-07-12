import { AppShell } from "@/components/layout/app-shell";
import { WeddingOrdersView } from "@/components/orders/wedding-orders-view";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { refreshOrders } from "@/lib/orders/repository";

export const dynamic = "force-dynamic";

export default async function WeddingOrdersPage() {
  await refreshOrders();
  return (
    <AppShell title="أوردرات الأفراح" subtitle={getModuleSlogan("weddings")}>
      <WeddingOrdersView />
    </AppShell>
  );
}
