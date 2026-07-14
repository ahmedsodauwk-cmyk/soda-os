import { AppShell } from "@/components/layout/app-shell";
import { WeddingClientsView } from "@/components/clients/wedding-clients-view";
import {
  getClients,
  getClientsBySegment,
  refreshClients,
} from "@/lib/clients/repository";
import {
  buildDataScope,
  scopeClients,
  scopeOrders,
  scopeProjects,
} from "@/lib/identity/data-scope";
import { resolveSessionForApp } from "@/lib/identity/session";
import { getOrders, refreshOrders } from "@/lib/orders/repository";
import { getPayments, refreshPayments } from "@/lib/payments/repository";
import { getProjects, refreshProjects } from "@/lib/projects/repository";
import { refreshAssignments } from "@/lib/assignments/repository";

export const dynamic = "force-dynamic";

export default async function WeddingClientsPage() {
  const session = await resolveSessionForApp();
  await Promise.all([
    refreshClients(),
    refreshProjects(),
    refreshOrders(),
    refreshPayments(),
    refreshAssignments(),
  ]);

  let clients = getClientsBySegment("wedding");
  let projects = getProjects();
  let orders = getOrders();
  let payments = getPayments();

  if (session && session.profile.accessLevel !== "founder") {
    const scope = buildDataScope(session, {
      orders: getOrders(),
      clients: getClients(),
    });
    clients = scopeClients(clients, scope);
    projects = scopeProjects(projects, scope);
    orders = scopeOrders(orders, scope);
    payments = [];
  }

  return (
    <AppShell
      titleKey="pages.weddingClients"
      layer="weddingClients"
      session={session}
    >
      <WeddingClientsView
        clients={clients}
        projects={projects}
        orders={orders}
        payments={payments}
      />
    </AppShell>
  );
}
