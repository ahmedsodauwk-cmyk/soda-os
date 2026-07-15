/**
 * Create a complete SODA Backup package (Mission 08.0 Phase 04–05, 08).
 * Unique timestamp id — never overwrites existing packages.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { collectSafeEnvMetadata } from "@/lib/backup/env-safe";
import {
  getBackupDir,
  getBackupZipPath,
  getBackupsRoot,
} from "@/lib/backup/paths";
import { appendBackupHistory } from "@/lib/backup/store";
import {
  BRAND_RELATIVE_FILES,
  collectAssetsIndex,
  collectDatabaseMetadata,
  collectStorageMetadata,
  collectSystemConfiguration,
  getApplicationVersion,
  getGitCommit,
  listAppliedMigrationFiles,
} from "@/lib/backup/system";
import {
  BACKUP_VERSION,
  type BackupHistoryEntry,
  type BackupManifest,
  type BackupType,
} from "@/lib/backup/types";
import { buildZipBuffer } from "@/lib/backup/zip";
import type { SodaSession } from "@/lib/identity/session";

export type CreateBackupResult =
  | {
      ok: true;
      backupId: string;
      entry: BackupHistoryEntry;
      downloadPath: string;
    }
  | {
      ok: false;
      error: string;
    };

function uniqueBackupId(now = new Date()): string {
  const iso = now.toISOString().replace(/[:.]/g, "-");
  const rand = Math.random().toString(36).slice(2, 8);
  return `soda-backup-${iso}-${rand}`;
}

function jsonBuf(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function createManualBackupPackage(
  session: SodaSession
): Promise<CreateBackupResult> {
  const backupType: BackupType = "manual";
  const createdAt = new Date().toISOString();
  const backupId = uniqueBackupId(new Date(createdAt));
  const dir = getBackupDir(backupId);
  const zipPath = getBackupZipPath(backupId);

  if (existsSync(dir) || existsSync(zipPath)) {
    return { ok: false, error: "Backup id collision — refused to overwrite." };
  }

  mkdirSync(getBackupsRoot(), { recursive: true });
  mkdirSync(path.join(dir, "brand"), { recursive: true });

  const [database, storage, assets] = await Promise.all([
    collectDatabaseMetadata(),
    collectStorageMetadata(),
    collectAssetsIndex(),
  ]);
  const system = collectSystemConfiguration();
  const env = collectSafeEnvMetadata();
  const migrations = listAppliedMigrationFiles();
  const version = getApplicationVersion();
  const commit = getGitCommit();

  const creator = {
    userId: session.userId,
    displayName:
      session.profile.displayName ||
      session.profile.fullName ||
      session.profile.email,
    email: session.profile.email,
  };

  const fileBodies: Record<string, Buffer> = {
    "database-metadata.json": jsonBuf(database),
    "storage-metadata.json": jsonBuf(storage),
    "assets-index.json": jsonBuf(assets),
    "system-configuration.json": jsonBuf(system),
    "environment-metadata.json": jsonBuf({
      note: "Presence flags only — values never exported.",
      env,
    }),
    "migrations.json": jsonBuf({ migrations }),
    "README.txt": Buffer.from(
      [
        "SODA OS Backup Package",
        "Brand: SODA VISUALS",
        `Backup ID: ${backupId}`,
        `Created: ${createdAt}`,
        "",
        "This package contains metadata and safe brand copies only.",
        "It does NOT contain passwords, API keys, tokens, or secrets.",
        "Restore is not implemented in Foundation (Coming Soon).",
        "",
      ].join("\n"),
      "utf8"
    ),
  };

  for (const [name, data] of Object.entries(fileBodies)) {
    writeFileSync(path.join(dir, name), data);
  }

  const brandRelPaths: string[] = [];
  for (const rel of BRAND_RELATIVE_FILES) {
    const abs = path.join(process.cwd(), rel);
    if (!existsSync(abs)) continue;
    const base = path.basename(rel);
    const destRel = `brand/${base}`;
    try {
      copyFileSync(abs, path.join(dir, destRel));
      brandRelPaths.push(destRel);
    } catch {
      // skip
    }
  }

  const zipEntriesFromDir = (): Array<{ name: string; data: Buffer }> => {
    const entries: Array<{ name: string; data: Buffer }> = [];
    for (const name of Object.keys(fileBodies)) {
      entries.push({
        name: `${backupId}/${name}`,
        data: readFileSync(path.join(dir, name)),
      });
    }
    for (const rel of brandRelPaths) {
      entries.push({
        name: `${backupId}/${rel}`,
        data: readFileSync(path.join(dir, rel)),
      });
    }
    return entries;
  };

  const draftManifest: BackupManifest = {
    product: "SODA OS",
    version,
    commit,
    createdAt,
    backupVersion: BACKUP_VERSION,
    backupId,
    backupType,
    database: database.status,
    storage: storage.status,
    assets: assets.status,
    migrations,
    creator,
    sizeBytes: 0,
  };

  writeFileSync(path.join(dir, "manifest.json"), jsonBuf(draftManifest));

  // Two-pass zip so manifest.sizeBytes matches the sealed package.
  let zipEntries = [
    { name: `${backupId}/manifest.json`, data: jsonBuf(draftManifest) },
    ...zipEntriesFromDir().filter((e) => !e.name.endsWith("/manifest.json")),
  ];
  let sealed = buildZipBuffer(zipEntries);
  draftManifest.sizeBytes = sealed.length;
  writeFileSync(path.join(dir, "manifest.json"), jsonBuf(draftManifest));
  zipEntries = [
    { name: `${backupId}/manifest.json`, data: jsonBuf(draftManifest) },
    ...zipEntriesFromDir().filter((e) => !e.name.endsWith("/manifest.json")),
  ];
  sealed = buildZipBuffer(zipEntries);
  draftManifest.sizeBytes = sealed.length;
  writeFileSync(path.join(dir, "manifest.json"), jsonBuf(draftManifest));

  if (existsSync(zipPath)) {
    return { ok: false, error: "Backup zip already exists — refused to overwrite." };
  }
  writeFileSync(zipPath, sealed);

  const entry: BackupHistoryEntry = {
    id: backupId,
    createdAt,
    sizeBytes: sealed.length,
    commit,
    version,
    creatorName: creator.displayName,
    creatorEmail: creator.email,
    backupType,
    zipFileName: `${backupId}.zip`,
  };

  try {
    appendBackupHistory(entry);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Failed to record backup history",
    };
  }

  return {
    ok: true,
    backupId,
    entry,
    downloadPath: `/api/backup/${encodeURIComponent(backupId)}/download`,
  };
}
