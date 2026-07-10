import { AppShell } from "@/components/layout/app-shell";
import { OrdersContent } from "@/components/orders/orders-content";

export default function OrdersPage() {
  return (
    <AppShell
      title="Orders"
      subtitle="Manage bookings and deliveries"
    >
      <OrdersContent />
    </AppShell>
  );
}
