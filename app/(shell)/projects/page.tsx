import { AppShell } from "@/components/layout/app-shell";
import { ProjectsListContent } from "@/components/projects/projects-list-content";
import { refreshClients } from "@/lib/clients/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

/**
 * Cross-client Projects index.
 * Projects always belong to one Client — use Client Workspace → Projects
 * for the client-owned view (`/clients/[id]/projects`).
 */
export default async function ProjectsPage() {
  await Promise.all([
    refreshClients(),
    refreshProjects(),
    refreshOrders(),
  ]);
  return (
    <AppShell titleKey="pages.projects" layer="projects">
      <ProjectsListContent />
    </AppShell>
  );
}
