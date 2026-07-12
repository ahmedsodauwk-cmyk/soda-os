import { AppShell } from "@/components/layout/app-shell";
import { OrdersHub } from "@/components/orders/orders-hub";
import { refreshClients } from "@/lib/clients/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await Promise.all([refreshClients(), refreshProjects(), refreshOrders()]);
  return (
    <AppShell titleKey="pages.orders" layer="orders">
      <OrdersHub />
    </AppShell>
  );
}
