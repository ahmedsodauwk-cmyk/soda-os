import { AppShell } from "@/components/layout/app-shell";
import { OrdersHub } from "@/components/orders/orders-hub";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default function OrdersPage() {
  return (
    <AppShell title="Orders" subtitle={getModuleSlogan("orders")}>
      <OrdersHub />
    </AppShell>
  );
}
