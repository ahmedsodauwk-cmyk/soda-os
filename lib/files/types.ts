/**
 * File / asset linked primarily to an Order (rolled up on Project).
 * Metadata lives in `public.files` — binary storage comes later.
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
