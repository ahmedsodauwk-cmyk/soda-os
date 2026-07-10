import { AppShell } from "@/components/layout/app-shell";
import { ClientsHub } from "@/components/clients/clients-hub";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default function ClientsPage() {
  return (
    <AppShell title="Clients" subtitle={getModuleSlogan("clients")}>
      <ClientsHub />
    </AppShell>
  );
}
