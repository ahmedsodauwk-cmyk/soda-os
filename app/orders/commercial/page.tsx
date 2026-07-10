import { AppShell } from "@/components/layout/app-shell";
import { CommercialOrdersView } from "@/components/orders/commercial-orders-view";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default function CommercialOrdersPage() {
  return (
    <AppShell title="Commercial Orders" subtitle={getModuleSlogan("commercial")}>
      <CommercialOrdersView />
    </AppShell>
  );
}
