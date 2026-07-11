import { AppShell } from "@/components/layout/app-shell";
import { OrdersHub } from "@/components/orders/orders-hub";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { refreshOrders } from "@/lib/orders/repository";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await refreshOrders();
  return (
    <AppShell title="Orders" subtitle={getModuleSlogan("orders")}>
      <OrdersHub />
    </AppShell>
  );
}
