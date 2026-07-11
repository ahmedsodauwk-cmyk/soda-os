import { AppShell } from "@/components/layout/app-shell";
import { CommercialOrdersView } from "@/components/orders/commercial-orders-view";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { refreshClients } from "@/lib/clients/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshPayments } from "@/lib/payments/repository";
import { refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function CommercialOrdersPage() {
  await Promise.all([
    refreshClients(),
    refreshProjects(),
    refreshOrders(),
    refreshPayments(),
  ]);
  return (
    <AppShell title="Commercial Orders" subtitle={getModuleSlogan("commercial")}>
      <CommercialOrdersView />
    </AppShell>
  );
}
