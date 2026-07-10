import { AppShell } from "@/components/layout/app-shell";
import { OrdersContent } from "@/components/orders/orders-content";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default function OrdersPage() {
  return (
    <AppShell title="Orders" subtitle={getModuleSlogan("orders")}>
      <OrdersContent />
    </AppShell>
  );
}
