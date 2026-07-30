"use client";

import { createClient } from "@/lib/supabase/client";
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  avatarStoragePath,
  isAllowedAvatarMime,
} from "@/lib/avatars/config";

export type AvatarUploadResult =
  | { ok: true; storagePath: string; publicUrl: string }
  | { ok: false; error: string };

export async function uploadAvatarBlob(
  userId: string,
  blob: Blob,
  mimeType: string
): Promise<AvatarUploadResult> {
  if (!isAllowedAvatarMime(mimeType)) {
    return { ok: false, error: "Only JPEG, PNG, or WebP images are allowed." };
  }
  if (blob.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: "Image must be 2 MB or smaller." };
  }

  const supabase = createClient();
  const path = avatarStoragePath(userId);
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, {
    contentType: mimeType,
    upsert: true,
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { ok: true, storagePath: path, publicUrl: data.publicUrl };
}
