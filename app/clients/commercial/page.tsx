import { AppShell } from "@/components/layout/app-shell";
import { CommercialClientsView } from "@/components/clients/commercial-clients-view";
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

export default async function CommercialClientsPage() {
  const session = await resolveSessionForApp();
  await Promise.all([
    refreshClients(),
    refreshProjects(),
    refreshOrders(),
    refreshPayments(),
    refreshAssignments(),
  ]);

  let clients = getClientsBySegment("commercial");
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
    // Payments / finance rows stay Founder-only on this surface.
    payments = [];
  }

  return (
    <AppShell
      titleKey="pages.commercialClients"
      layer="commercialClients"
      session={session}
    >
      <CommercialClientsView
        clients={clients}
        projects={projects}
        orders={orders}
        payments={payments}
      />
    </AppShell>
  );
}
