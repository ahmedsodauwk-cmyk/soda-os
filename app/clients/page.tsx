import { AppShell } from "@/components/layout/app-shell";
import { ClientsContent } from "@/components/clients/clients-content";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default function ClientsPage() {
  return (
    <AppShell title="Clients" subtitle={getModuleSlogan("clients")}>
      <ClientsContent />
    </AppShell>
  );
}
