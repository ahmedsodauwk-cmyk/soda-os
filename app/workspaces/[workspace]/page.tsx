import { redirect } from "next/navigation";

interface WorkspaceDetailRedirectProps {
  params: Promise<{ workspace: string }>;
}

/** Compatibility — /workspaces/:id → /commercial/:id */
export default async function WorkspaceDetailRedirect({
  params,
}: WorkspaceDetailRedirectProps) {
  const { workspace } = await params;
  redirect(`/commercial/${workspace}`);
}
