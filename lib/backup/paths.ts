/**
 * Backup filesystem paths.
 *
 * Architecture note (Vercel): the default serverless filesystem is ephemeral.
 * Create / list / download still work for Foundation — Founder can download the
 * package immediately after create. Persist across deploys needs a mounted
 * volume or a future cloud provider (stubs in providers.ts).
 */

import path from "node:path";

export const BACKUPS_ROOT_SEGMENT = "data/backups";

export function getBackupsRoot(): string {
  return path.join(process.cwd(), "data", "backups");
}

export function getBackupDir(backupId: string): string {
  return path.join(getBackupsRoot(), backupId);
}

export function getBackupZipPath(backupId: string): string {
  return path.join(getBackupsRoot(), `${backupId}.zip`);
}

export function getBackupIndexPath(): string {
  return path.join(getBackupsRoot(), "index.json");
}

export function isEphemeralBackupFs(): boolean {
  return (
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  );
}
