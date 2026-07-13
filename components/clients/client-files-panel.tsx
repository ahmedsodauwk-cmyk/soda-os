import Link from "next/link";

import { RelationshipEmptyState } from "@/components/clients/relationship-empty-state";
import { Badge } from "@/components/ui/badge";
import { getClientFilesWorkspace } from "@/lib/clients/aggregators";

interface ClientFilesPanelProps {
  clientId: string;
}

/** Files belonging to this client (direct clientId or via their projects). */
export function ClientFilesPanel({ clientId }: ClientFilesPanelProps) {
  const view = getClientFilesWorkspace(clientId);

  if (view.files.length === 0) {
    return (
      <RelationshipEmptyState
        title="Files"
        question="Attachments?"
        detail="No files linked to this relationship yet. Client-scoped and project-linked files will collect here permanently."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-heading text-base font-semibold">Files</h3>
          <p className="text-sm text-muted-foreground">
            Client-scoped assets only (direct link or via this client&apos;s projects).
          </p>
        </div>
        <Badge variant="outline">{view.files.length}</Badge>
      </div>

      <ul className="space-y-2">
        {view.files.map((file) => {
          const href = file.storageUrl
            ? file.storageUrl
            : file.orderId
              ? `/orders/${file.orderId}`
              : `/projects/${file.projectId}`;
          const external = Boolean(file.storageUrl);

          return (
            <li key={file.id}>
              <Link
                href={href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3 transition-colors hover:border-soda-pink/35"
              >
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.type}
                    {file.size ? ` · ${file.size}` : ""}
                    {file.orderId ? ` · ${file.orderId}` : ""}
                    {" · "}
                    {file.updatedAt.slice(0, 10)}
                  </p>
                </div>
                <Badge variant="outline">{file.mimeType ?? "file"}</Badge>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
