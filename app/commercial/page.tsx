import { AppShell } from "@/components/layout/app-shell";
import { CommercialHubContent } from "@/components/commercial/commercial-hub-content";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default function CommercialPage() {
  return (
    <AppShell title="Commercial" subtitle={getModuleSlogan("workspaces")}>
      <CommercialHubContent />
    </AppShell>
  );
}
