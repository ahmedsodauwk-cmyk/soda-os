import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { OrdersHub } from "@/components/orders/orders-hub";
import { refreshClients } from "@/lib/clients/repository";
import { resolveSessionForApp } from "@/lib/identity/session";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";

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

  await Promise.all([refreshClients(), refreshProjects(), refreshOrders()]);
  return (
    <AppShell titleKey="pages.orders" layer="orders" session={session}>
      <RoleGate session={session} anyOf={["orders.view"]}>
        <OrdersHub />
      </RoleGate>
    </AppShell>
  );
}
