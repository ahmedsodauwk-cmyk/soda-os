/** Profile avatar upload constraints. */

export const AVATAR_BUCKET = "profile-avatars";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export const AVATAR_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const AVATAR_OUTPUT_SIZE = 512;

export function isAllowedAvatarMime(mime: string): boolean {
  return AVATAR_ALLOWED_MIME.has(mime);
}

export function avatarStoragePath(userId: string): string {
  return `${userId}/avatar.webp`;
}
