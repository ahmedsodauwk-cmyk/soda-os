import type { ConnectAttachmentKind } from "@/lib/connect/types";

const OFFICE = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export function attachmentKindFromMime(
  mime: string,
  forceVoice = false
): ConnectAttachmentKind {
  if (forceVoice) return "voice";
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "pdf";
  if (OFFICE.has(m)) return "office";
  if (
    m === "application/zip" ||
    m === "application/x-zip-compressed" ||
    m === "application/x-rar-compressed" ||
    m === "application/x-7z-compressed"
  ) {
    return "zip";
  }
  return "other";
}

export function isAllowedConnectMime(mime: string): boolean {
  const m = mime.toLowerCase();
  if (
    m.startsWith("image/") ||
    m.startsWith("video/") ||
    m.startsWith("audio/")
  ) {
    return true;
  }
  if (m === "application/pdf") return true;
  if (OFFICE.has(m)) return true;
  if (
    m === "application/zip" ||
    m === "application/x-zip-compressed" ||
    m === "application/octet-stream"
  ) {
    return true;
  }
  return false;
}
