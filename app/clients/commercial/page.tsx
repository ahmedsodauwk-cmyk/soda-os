import { AppShell } from "@/components/layout/app-shell";
import { CommercialClientsView } from "@/components/clients/commercial-clients-view";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export const dynamic = "force-dynamic";

export default function CommercialClientsPage() {
  return (
    <AppShell title="Commercial Clients" subtitle={getModuleSlogan("commercial")}>
      <CommercialClientsView />
    </AppShell>
  );
}
