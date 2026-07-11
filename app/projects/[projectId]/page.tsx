import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ProjectHubContent } from "@/components/projects/project-hub-content";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { getFilesByProject, refreshFiles } from "@/lib/files/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { fetchProjectById } from "@/lib/projects/repository";
import { refreshPayments } from "@/lib/payments/repository";
import type { ProjectFile } from "@/lib/projects/types";

interface ProjectHubPageProps {
  params: Promise<{ projectId: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProjectHubPage({ params }: ProjectHubPageProps) {
  const { projectId } = await params;
  await Promise.all([refreshOrders(), refreshPayments(), refreshFiles()]);
  const project = await fetchProjectById(projectId);

  if (!project) {
    notFound();
  }

  const supabaseFiles = getFilesByProject(projectId);
  const files: ProjectFile[] =
    supabaseFiles.length > 0
      ? supabaseFiles.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          updatedAt: f.updatedAt,
        }))
      : project.files;

  return (
    <AppShell
      title={project.name}
      subtitle={getModuleSlogan("projectHub")}
    >
      <ProjectHubContent project={{ ...project, files }} />
    </AppShell>
  );
}
