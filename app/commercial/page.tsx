import { AppShell } from "@/components/layout/app-shell";
import { CommercialHubContent } from "@/components/commercial/commercial-hub-content";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function CommercialPage() {
  await Promise.all([refreshProjects(), refreshOrders()]);
  return (
    <AppShell titleKey="pages.commercial" layer="commercial">
      <CommercialHubContent />
    </AppShell>
  );
}
