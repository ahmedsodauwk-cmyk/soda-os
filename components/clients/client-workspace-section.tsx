import { notFound } from "next/navigation";

import { ClientWorkspaceNav } from "@/components/clients/client-workspace-nav";
import { fetchClientById } from "@/lib/clients/repository";
import {
  CLIENT_BUSINESS_ROLE_LABELS,
  CLIENT_WORKSPACE_TREE,
  type ClientWorkspaceSectionId,
} from "@/lib/clients/workspace";
import type { Client } from "@/lib/clients/types";

interface ClientWorkspaceSectionPageProps {
  clientId: string;
  section: ClientWorkspaceSectionId;
  children: React.ReactNode;
}

/**
 * Client Workspace chrome: real client header + section nav + body.
 */
export async function ClientWorkspaceSectionPage({
  clientId,
  section,
  children,
}: ClientWorkspaceSectionPageProps) {
  const client = await fetchClientById(clientId);
  if (!client) notFound();

  const meta = CLIENT_WORKSPACE_TREE.find((s) => s.id === section);
  if (!meta) notFound();

  return (
    <div className="space-y-6">
      <ClientWorkspaceHeader client={client} />
      <ClientWorkspaceNav clientId={clientId} active={section} />
      {children}
    </div>
  );
}

function ClientWorkspaceHeader({ client }: { client: Client }) {
  return (
    <div className="space-y-1">
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        {client.name}
      </h2>
      <p className="text-sm text-muted-foreground">
        {CLIENT_BUSINESS_ROLE_LABELS[client.businessRole]} · {client.segment} ·{" "}
        {client.type}
      </p>
    </div>
  );
}
