/**
 * Files repository — source of truth is `public.files` (metadata only).
 */
import { createFilesDb } from "@/lib/files/db";
import {
  fileToRow,
  rowToFile,
  type FileRow,
} from "@/lib/files/mappers";
import type { FileAsset } from "@/lib/files/types";

let filesCache: FileAsset[] = [];

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `file-${crypto.randomUUID()}`;
  }
  return `file-${Date.now().toString(36)}`;
}

function upsertCache(file: FileAsset): void {
  filesCache = [file, ...filesCache.filter((f) => f.id !== file.id)];
}

/** Load files from Supabase into the sync cache. */
export async function refreshFiles(): Promise<FileAsset[]> {
  const db = createFilesDb();
  const { data, error } = await db
    .from("files")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load files: ${error.message}`);
  }
  filesCache = ((data ?? []) as FileRow[]).map(rowToFile);
  return [...filesCache];
}

export function getFiles(): FileAsset[] {
  return [...filesCache];
}

export function getFileById(id: string): FileAsset | undefined {
  return filesCache.find((f) => f.id === id);
}

export function getFilesByOrder(orderId: string): FileAsset[] {
  return filesCache.filter((f) => f.orderId === orderId);
}

export function getFilesByProject(projectId: string): FileAsset[] {
  return filesCache.filter((f) => f.projectId === projectId);
}

export type NewFileInput = Omit<FileAsset, "id" | "updatedAt"> & {
  id?: string;
  updatedAt?: string;
};

export async function createFile(input: NewFileInput): Promise<FileAsset> {
  const now = new Date().toISOString();
  const file: FileAsset = {
    id: input.id ?? newId(),
    name: input.name,
    type: input.type,
    size: input.size,
    projectId: input.projectId,
    updatedAt: input.updatedAt ?? now,
    ...(input.orderId ? { orderId: input.orderId } : {}),
    ...(input.clientId ? { clientId: input.clientId } : {}),
    ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
    ...(input.storageKey ? { storageKey: input.storageKey } : {}),
    ...(input.storageUrl ? { storageUrl: input.storageUrl } : {}),
    ...(input.mimeType ? { mimeType: input.mimeType } : {}),
  };

  const db = createFilesDb();
  const { error } = await db.from("files").insert(fileToRow(file));
  if (error) {
    throw new Error(`Failed to create file: ${error.message}`);
  }
  upsertCache(file);
  return file;
}

export function getFilesByClient(clientId: string): FileAsset[] {
  return filesCache.filter((f) => f.clientId === clientId);
}

export async function updateFile(
  id: string,
  patch: Partial<Omit<FileAsset, "id">>
): Promise<FileAsset> {
  const existing = getFileById(id);
  if (!existing) {
    throw new Error(`File not found: ${id}`);
  }
  const next: FileAsset = {
    ...existing,
    ...patch,
    id,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };

  const db = createFilesDb();
  const { error } = await db.from("files").update(fileToRow(next)).eq("id", id);
  if (error) {
    throw new Error(`Failed to update file: ${error.message}`);
  }
  upsertCache(next);
  return next;
}

export async function deleteFile(id: string): Promise<void> {
  const db = createFilesDb();
  const { error } = await db.from("files").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
  filesCache = filesCache.filter((f) => f.id !== id);
}
