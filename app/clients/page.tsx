import { AppShell } from "@/components/layout/app-shell";
import { ClientsHub } from "@/components/clients/clients-hub";
import { RoleGate } from "@/components/identity/role-gate";
import {
  getClients,
  refreshClients,
} from "@/lib/clients/repository";
import {
  buildDataScope,
  scopeClients,
} from "@/lib/identity/data-scope";
import { resolveSessionForApp } from "@/lib/identity/session";
import { getOrders, refreshOrders } from "@/lib/orders/repository";
import { refreshAssignments } from "@/lib/assignments/repository";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await resolveSessionForApp();
  await Promise.all([
    refreshClients(),
    refreshOrders(),
    refreshAssignments(),
  ]);

  if (!session) {
    return (
      <AppShell titleKey="pages.clients" layer="clients" session={null}>
        <ClientsHub />
      </AppShell>
    );
  }

  const scope = buildDataScope(session, {
    orders: getOrders(),
    clients: getClients(),
  });
  const scoped = scopeClients(getClients(), scope);
  const allowedClientIds =
    scope.clientIds === null ? null : [...scope.clientIds];

  return (
    <AppShell titleKey="pages.clients" layer="clients" session={session}>
      <RoleGate session={session} anyOf={["clients.view"]} path="/clients">
        <ClientsHub clients={scoped} allowedClientIds={allowedClientIds} />
      </RoleGate>
    </AppShell>
  );
}
