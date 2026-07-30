/**
 * Resolve stored avatar_url to a displayable URL.
 * Supports legacy http(s) URLs and profile-avatars storage paths.
 */

import { AVATAR_BUCKET } from "@/lib/avatars/config";

export function resolveAvatarDisplayUrl(
  raw: string | null | undefined,
  supabaseUrl?: string
): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  const base = supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return value;
  const path = value.startsWith(`${AVATAR_BUCKET}/`)
    ? value.slice(`${AVATAR_BUCKET}/`.length)
    : value;
  return `${base}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}
