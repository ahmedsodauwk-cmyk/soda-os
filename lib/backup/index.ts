/**
 * SODA Backup Center — Mission 08.0 Foundation
 *
 * Architecture:
 * - Founder-only module at /settings/backup
 * - Packages live under data/backups/ (unique timestamp ids; never overwrite)
 * - Each backup: directory of metadata JSON + brand copies + .zip for download
 * - Secrets are never exported (env presence booleans only)
 * - Cloud providers are stubs only (Google Drive / OneDrive / S3 / NAS)
 * - Restore is intentionally disabled
 * - On Vercel, local FS is ephemeral — download immediately after create;
 *   persistent remote storage lands in a later mission via provider adapters
 */

export { requireBackupFounder, canAccessBackupCenter } from "@/lib/backup/access";
export { createBackupAction } from "@/lib/backup/actions";
export { BACKUP_CLOUD_PROVIDERS } from "@/lib/backup/providers";
export { getBackupDashboardStatus } from "@/lib/backup/status";
export { formatBytes } from "@/lib/backup/format";
export { readBackupIndex } from "@/lib/backup/store";
export type {
  BackupCloudProvider,
  BackupDashboardStatus,
  BackupHistoryEntry,
  BackupManifest,
  BackupType,
  HealthStatus,
} from "@/lib/backup/types";
