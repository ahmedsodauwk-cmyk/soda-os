/**
 * File / asset linked primarily to an Order (rolled up on Project).
 * Storage is mock-only — no uploads in this sprint.
 */
export interface FileAsset {
  id: string;
  name: string;
  type: string;
  size: string;
  orderId?: string;
  projectId: string;
  workspaceId?: string;
  storageKey?: string;
  updatedAt: string;
  mimeType?: string;
}
