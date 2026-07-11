import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ProjectHubContent } from "@/components/projects/project-hub-content";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { refreshOrders } from "@/lib/orders/repository";
import { fetchProjectById } from "@/lib/projects/repository";
import { refreshPayments } from "@/lib/payments/repository";

interface ProjectHubPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectHubPage({ params }: ProjectHubPageProps) {
  const { projectId } = await params;
  await refreshOrders();
  await refreshPayments();
  const project = await fetchProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <AppShell
      title={project.name}
      subtitle={getModuleSlogan("projectHub")}
    >
      <ProjectHubContent project={project} />
    </AppShell>
  );
}
