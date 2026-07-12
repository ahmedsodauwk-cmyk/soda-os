import { AppShell } from "@/components/layout/app-shell";
import { ProjectsListContent } from "@/components/projects/projects-list-content";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { refreshClients } from "@/lib/clients/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await Promise.all([
    refreshClients(),
    refreshProjects(),
    refreshOrders(),
  ]);
  return (
    <AppShell title="المشاريع" subtitle={getModuleSlogan("projects")}>
      <ProjectsListContent />
    </AppShell>
  );
}
