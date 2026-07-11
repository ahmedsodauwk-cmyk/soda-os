import type { FileAsset } from "@/lib/files/types";

export type FileRow = {
  id: string;
  name: string;
  type: string;
  size: string;
  order_id: string | null;
  project_id: string;
  client_id?: string | null;
  workspace_id: string | null;
  storage_key: string | null;
  storage_url?: string | null;
  mime_type: string | null;
  updated_at: string;
  created_at?: string;
};

export function rowToFile(row: FileRow): FileAsset {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    size: row.size,
    projectId: row.project_id,
    updatedAt: row.updated_at,
    ...(row.order_id ? { orderId: row.order_id } : {}),
    ...(row.client_id ? { clientId: row.client_id } : {}),
    ...(row.workspace_id ? { workspaceId: row.workspace_id } : {}),
    ...(row.storage_key ? { storageKey: row.storage_key } : {}),
    ...(row.storage_url ? { storageUrl: row.storage_url } : {}),
    ...(row.mime_type ? { mimeType: row.mime_type } : {}),
  };
}

export function fileToRow(file: FileAsset): Record<string, unknown> {
  return {
    id: file.id,
    name: file.name,
    type: file.type,
    size: file.size,
    order_id: file.orderId ?? null,
    project_id: file.projectId,
    client_id: file.clientId ?? null,
    workspace_id: file.workspaceId ?? null,
    storage_key: file.storageKey ?? null,
    storage_url: file.storageUrl ?? null,
    mime_type: file.mimeType ?? null,
    updated_at: file.updatedAt,
  };
}
