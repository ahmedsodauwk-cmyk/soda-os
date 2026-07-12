import { AppShell } from "@/components/layout/app-shell";
import { WeddingClientsView } from "@/components/clients/wedding-clients-view";
import {
  getClientsBySegment,
  refreshClients,
} from "@/lib/clients/repository";
import { getOrders, refreshOrders } from "@/lib/orders/repository";
import { getPayments, refreshPayments } from "@/lib/payments/repository";
import { getProjects, refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function WeddingClientsPage() {
  await Promise.all([
    refreshClients(),
    refreshProjects(),
    refreshOrders(),
    refreshPayments(),
  ]);
  return (
    <AppShell titleKey="pages.weddingClients" layer="weddingClients">
      <WeddingClientsView
        clients={getClientsBySegment("wedding")}
        projects={getProjects()}
        orders={getOrders()}
        payments={getPayments()}
      />
    </AppShell>
  );
}
