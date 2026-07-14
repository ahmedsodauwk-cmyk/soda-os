import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { OrdersHub } from "@/components/orders/orders-hub";
import { refreshClients, getClients } from "@/lib/clients/repository";
import {
  buildDataScope,
  scopeEmptyReason,
  scopeOrders,
} from "@/lib/identity/data-scope";
import { resolveSessionForApp } from "@/lib/identity/session";
import { getOrders, refreshOrders } from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";
import { refreshAssignments } from "@/lib/assignments/repository";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await resolveSessionForApp();
  if (!session) {
    return (
      <AppShell titleKey="pages.orders" layer="orders" session={null}>
        <OrdersHub />
      </AppShell>
    );
  }

  await Promise.all([
    refreshClients(),
    refreshProjects(),
    refreshOrders(),
    refreshAssignments(),
  ]);

  const scope = buildDataScope(session, {
    orders: getOrders(),
    clients: getClients(),
  });
  const scoped = scopeOrders(getOrders(), scope);
  const allowedOrderIds =
    scope.orderIds === null ? null : [...scope.orderIds];
  const showLanes =
    session.profile.accessLevel === "founder" ||
    session.profile.accessLevel === "account_manager";
  const note = scopeEmptyReason(scope);

  return (
    <AppShell titleKey="pages.orders" layer="orders" session={session}>
      <RoleGate session={session} anyOf={["orders.view"]} path="/orders">
        {note ? (
          <p className="mb-4 text-sm text-muted-foreground">{note}</p>
        ) : null}
        <OrdersHub
          orders={scoped}
          allowedOrderIds={allowedOrderIds}
          showLanes={showLanes}
        />
      </RoleGate>
    </AppShell>
  );
}
