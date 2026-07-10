import { AppShell } from "@/components/layout/app-shell";
import { WeddingClientsView } from "@/components/clients/wedding-clients-view";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { getClientsBySegment } from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import { getPayments } from "@/lib/payments/repository";
import { getProjects } from "@/lib/projects/repository";

export default function WeddingClientsPage() {
  return (
    <AppShell title="Wedding Clients" subtitle={getModuleSlogan("weddings")}>
      <WeddingClientsView
        clients={getClientsBySegment("wedding")}
        projects={getProjects()}
        orders={getOrders()}
        payments={getPayments()}
      />
    </AppShell>
  );
}
