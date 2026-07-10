import { AppShell } from "@/components/layout/app-shell";
import { ClientProfile } from "@/components/clients/client-profile";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="Client" subtitle={getModuleSlogan("clients")}>
      <ClientProfile clientId={id} />
    </AppShell>
  );
}
