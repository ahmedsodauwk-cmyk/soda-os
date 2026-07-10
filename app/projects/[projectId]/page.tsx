import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ProjectHubContent } from "@/components/projects/project-hub-content";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { getProjectById } from "@/lib/projects/repository";

interface ProjectHubPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectHubPage({ params }: ProjectHubPageProps) {
  const { projectId } = await params;
  const project = getProjectById(projectId);

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
