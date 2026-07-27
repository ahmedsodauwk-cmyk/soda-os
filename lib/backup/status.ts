/**
 * Dashboard status aggregation for Backup Center.
 */

import { isEphemeralBackupFs } from "@/lib/backup/paths";
import { readBackupIndex } from "@/lib/backup/store";
import {
  collectAssetsIndex,
  collectDatabaseMetadata,
  collectStorageMetadata,
  getApplicationVersion,
  getGitCommit,
  getLastMigrationName,
} from "@/lib/backup/system";
import type { BackupDashboardStatus, HealthStatus } from "@/lib/backup/types";

function rollup(
  parts: HealthStatus[]
): HealthStatus {
  if (parts.every((p) => p === "OK")) return "OK";
  if (parts.some((p) => p === "UNAVAILABLE")) return "DEGRADED";
  if (parts.some((p) => p === "DEGRADED")) return "DEGRADED";
  if (parts.some((p) => p === "UNKNOWN")) return "UNKNOWN";
  return "OK";
}

function fallbackBackupDashboardStatus(): BackupDashboardStatus {
  return {
    systemStatus: "UNKNOWN",
    lastBackupAt: null,
    totalBackups: 0,
    totalSizeBytes: 0,
    gitCommit: getGitCommit(),
    applicationVersion: getApplicationVersion(),
    lastDatabaseMigration: getLastMigrationName(),
    storageStatus: "UNKNOWN",
    assetsStatus: "UNKNOWN",
    databaseStatus: "UNKNOWN",
    ephemeralStorage: isEphemeralBackupFs(),
  };
}

/** Never throws — safe for Founder Home and other Server Component surfaces. */
export async function getBackupDashboardStatus(): Promise<BackupDashboardStatus> {
  try {
    const history = readBackupIndex();
    const [database, storage, assets] = await Promise.all([
      collectDatabaseMetadata(),
      collectStorageMetadata(),
      collectAssetsIndex(),
    ]);

    const totalSizeBytes = history.reduce(
      (sum, b) => sum + (b.sizeBytes || 0),
      0
    );
    const lastBackupAt = history[0]?.createdAt ?? null;

    return {
      systemStatus: rollup([
        database.status,
        storage.status,
        assets.status,
      ]),
      lastBackupAt,
      totalBackups: history.length,
      totalSizeBytes,
      gitCommit: getGitCommit(),
      applicationVersion: getApplicationVersion(),
      lastDatabaseMigration: getLastMigrationName(),
      storageStatus: storage.status,
      assetsStatus: assets.status,
      databaseStatus: database.status,
      ephemeralStorage: isEphemeralBackupFs(),
    };
  } catch {
    return fallbackBackupDashboardStatus();
  }
}
