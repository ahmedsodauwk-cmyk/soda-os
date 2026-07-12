import { AppShell } from "@/components/layout/app-shell";
import { OrdersHub } from "@/components/orders/orders-hub";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { refreshClients } from "@/lib/clients/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await Promise.all([refreshClients(), refreshProjects(), refreshOrders()]);
  return (
    <AppShell title="الأوردرات" subtitle={getModuleSlogan("orders")}>
      <OrdersHub />
    </AppShell>
  );
}
