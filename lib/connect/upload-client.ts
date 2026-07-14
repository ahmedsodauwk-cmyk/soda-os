"use client";

import { createClient } from "@/lib/supabase/client";
import { attachmentKindFromMime, isAllowedConnectMime } from "@/lib/connect/mime";
import type { ConnectAttachmentKind } from "@/lib/connect/types";

export type PreparedConnectUpload = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: ConnectAttachmentKind;
  durationMs?: number | null;
};

export async function uploadConnectFiles(
  userId: string,
  files: File[],
  opts?: { forceVoice?: boolean; onProgress?: (pct: number) => void }
): Promise<
  | { ok: true; files: PreparedConnectUpload[] }
  | { ok: false; error: string }
> {
  const supabase = createClient();
  const out: PreparedConnectUpload[] = [];
  let done = 0;

  for (const file of files) {
    const mime = file.type || "application/octet-stream";
    if (!isAllowedConnectMime(mime) && !opts?.forceVoice) {
      return { ok: false, error: `نوع الملف مش مدعوم: ${file.name}` };
    }
    const safeName = file.name.replace(/[^\w.\-()\s\u0600-\u06FF]+/g, "_");
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error } = await supabase.storage.from("connect").upload(path, file, {
      contentType: mime,
      upsert: false,
    });
    if (error) return { ok: false, error: error.message };
    out.push({
      storagePath: path,
      fileName: file.name,
      mimeType: mime,
      sizeBytes: file.size,
      kind: attachmentKindFromMime(mime, !!opts?.forceVoice),
    });
    done += 1;
    opts?.onProgress?.(Math.round((done / files.length) * 100));
  }

  return { ok: true, files: out };
}
