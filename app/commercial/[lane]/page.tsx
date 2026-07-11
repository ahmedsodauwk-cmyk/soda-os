import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { CommercialLaneContent } from "@/components/commercial/commercial-lane-content";
import { getWorkspaceSlogan } from "@/lib/brand/soda-voice";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";
import { getWorkspaceSummaryById } from "@/lib/workspaces/repository";

interface CommercialLanePageProps {
  params: Promise<{ lane: string }>;
}

export const dynamic = "force-dynamic";

export default async function CommercialLanePage({
  params,
}: CommercialLanePageProps) {
  const { lane } = await params;
  await Promise.all([refreshProjects(), refreshOrders()]);
  const workspace = getWorkspaceSummaryById(lane);

  if (!workspace) {
    notFound();
  }

  return (
    <AppShell
      title={workspace.label}
      subtitle={getWorkspaceSlogan(workspace.id)}
    >
      <CommercialLaneContent workspace={workspace} />
    </AppShell>
  );
}
