import { AppShell } from "@/components/layout/app-shell";
import { CommercialClientsView } from "@/components/clients/commercial-clients-view";
import {
  getClientsBySegment,
  refreshClients,
} from "@/lib/clients/repository";
import { getOrders, refreshOrders } from "@/lib/orders/repository";
import { getPayments, refreshPayments } from "@/lib/payments/repository";
import { getProjects, refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function CommercialClientsPage() {
  await Promise.all([
    refreshClients(),
    refreshProjects(),
    refreshOrders(),
    refreshPayments(),
  ]);
  return (
    <AppShell titleKey="pages.commercialClients" layer="commercialClients">
      <CommercialClientsView
        clients={getClientsBySegment("commercial")}
        projects={getProjects()}
        orders={getOrders()}
        payments={getPayments()}
      />
    </AppShell>
  );
}
