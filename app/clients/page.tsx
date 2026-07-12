import { AppShell } from "@/components/layout/app-shell";
import { ClientsHub } from "@/components/clients/clients-hub";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { refreshClients } from "@/lib/clients/repository";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  await refreshClients();
  return (
    <AppShell title="العملاء" subtitle={getModuleSlogan("clients")}>
      <ClientsHub />
    </AppShell>
  );
}
