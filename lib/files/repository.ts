import { mockFiles } from "@/lib/files/mock-data";
import type { FileAsset } from "@/lib/files/types";

export function getFiles(): FileAsset[] {
  return [...mockFiles];
}

export function getFileById(id: string): FileAsset | undefined {
  return mockFiles.find((f) => f.id === id);
}

export function getFilesByOrder(orderId: string): FileAsset[] {
  return mockFiles.filter((f) => f.orderId === orderId);
}

export function getFilesByProject(projectId: string): FileAsset[] {
  return mockFiles.filter((f) => f.projectId === projectId);
}
