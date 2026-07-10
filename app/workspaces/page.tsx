import { AppShell } from "@/components/layout/app-shell";
import { WorkspacesContent } from "@/components/workspaces/workspaces-content";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default function WorkspacesPage() {
  return (
    <AppShell title="Workspaces" subtitle={getModuleSlogan("workspaces")}>
      <WorkspacesContent />
    </AppShell>
  );
}
