import { AppShell } from "@/components/layout/app-shell";
import { WorkspacesContent } from "@/components/workspaces/workspaces-content";

export default function WorkspacesPage() {
  return (
    <AppShell
      title="Workspaces"
      subtitle="Studio production lanes and project hubs"
    >
      <WorkspacesContent />
    </AppShell>
  );
}
