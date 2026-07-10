import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceDetailContent } from "@/components/workspaces/workspace-detail-content";
import { getWorkspaceSlogan } from "@/lib/brand/soda-voice";
import { getWorkspaceSummaryById } from "@/lib/workspaces/repository";

interface WorkspaceDetailPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function WorkspaceDetailPage({
  params,
}: WorkspaceDetailPageProps) {
  const { workspace: workspaceParam } = await params;
  const workspace = getWorkspaceSummaryById(workspaceParam);

  if (!workspace) {
    notFound();
  }

  return (
    <AppShell
      title={workspace.label}
      subtitle={getWorkspaceSlogan(workspace.id)}
    >
      <WorkspaceDetailContent workspace={workspace} />
    </AppShell>
  );
}
