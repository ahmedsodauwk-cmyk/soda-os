import { AppShell } from "@/components/layout/app-shell";
import { ClientsContent } from "@/components/clients/clients-content";

export default function ClientsPage() {
  return (
    <AppShell
      title="Clients"
      subtitle="Manage individual and company clients"
    >
      <ClientsContent />
    </AppShell>
  );
}
