/**
 * File / asset linked primarily to an Order (rolled up on Project).
 * Metadata in `public.files`; binary in storage bucket `soda-files` when uploaded.
 */
export interface FileAsset {
  id: string;
  name: string;
  type: string;
  size: string;
  orderId?: string;
  projectId: string;
  clientId?: string;
  workspaceId?: string;
  storageKey?: string;
  storageUrl?: string;
  updatedAt: string;
  mimeType?: string;
}
