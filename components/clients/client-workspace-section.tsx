import { notFound } from "next/navigation";

import { ClientWorkspaceNav } from "@/components/clients/client-workspace-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  /** Optional body for Overview — full profile stays on overview. */
  children?: React.ReactNode;
}

/**
 * Foundation shell: loads a real Client by id (no fake data) and shows
 * workspace nav + a thin placeholder for sections not yet built (04.2+).
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
      {children ?? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">{meta.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{meta.description}</p>
            <p>
              Foundation route only — Client Workspace UI lands in later missions.
              Owns: {meta.owns}.
            </p>
          </CardContent>
        </Card>
      )}
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
