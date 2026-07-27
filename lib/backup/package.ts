/**
 * Create a complete SODA Backup package (Mission 08.0 Phase 04–05, 08).
 * Unique timestamp id — never overwrites existing packages.
 */

import {
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
  isEphemeralBackupFs,
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

export type AssembledBackupPackage = {
  backupId: string;
  entry: BackupHistoryEntry;
  buffer: Buffer;
};

async function assembleManualBackupPackage(
  session: SodaSession
): Promise<AssembledBackupPackage | { error: string }> {
  const backupType: BackupType = "manual";
  const createdAt = new Date().toISOString();
  const backupId = uniqueBackupId(new Date(createdAt));
  const dir = getBackupDir(backupId);
  const zipPath = getBackupZipPath(backupId);

  if (existsSync(dir) || existsSync(zipPath)) {
    return { error: "Backup id collision — refused to overwrite." };
  }

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
        "SODA OS Recovery Metadata Package",
        "Brand: SODA VISUALS",
        `Backup ID: ${backupId}`,
        `Created: ${createdAt}`,
        "",
        "This package contains metadata and safe brand copies only.",
        "It is NOT a full database or storage backup.",
        "It does NOT contain passwords, API keys, tokens, or secrets.",
        "Restore is not implemented in Foundation (Coming Soon).",
        "",
      ].join("\n"),
      "utf8"
    ),
  };

  const brandRelPaths: Array<{ rel: string; data: Buffer }> = [];
  for (const rel of BRAND_RELATIVE_FILES) {
    const abs = path.join(process.cwd(), rel);
    if (!existsSync(abs)) continue;
    const base = path.basename(rel);
    const destRel = `brand/${base}`;
    try {
      brandRelPaths.push({ rel: destRel, data: readFileSync(abs) });
    } catch {
      // skip
    }
  }

  const zipEntriesFromMemory = (): Array<{ name: string; data: Buffer }> => {
    const entries: Array<{ name: string; data: Buffer }> = [];
    for (const [name, data] of Object.entries(fileBodies)) {
      entries.push({ name: `${backupId}/${name}`, data });
    }
    for (const { rel, data } of brandRelPaths) {
      entries.push({ name: `${backupId}/${rel}`, data });
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

  let zipEntries = [
    { name: `${backupId}/manifest.json`, data: jsonBuf(draftManifest) },
    ...zipEntriesFromMemory(),
  ];
  let sealed = buildZipBuffer(zipEntries);
  draftManifest.sizeBytes = sealed.length;
  zipEntries = [
    { name: `${backupId}/manifest.json`, data: jsonBuf(draftManifest) },
    ...zipEntriesFromMemory(),
  ];
  sealed = buildZipBuffer(zipEntries);
  draftManifest.sizeBytes = sealed.length;

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

  return { backupId, entry, buffer: sealed };
}

function persistBackupPackage(
  backupId: string,
  fileBodies: Record<string, Buffer>,
  brandRelPaths: Array<{ rel: string; data: Buffer }>,
  manifest: BackupManifest,
  buffer: Buffer
): void {
  const dir = getBackupDir(backupId);
  const zipPath = getBackupZipPath(backupId);
  mkdirSync(getBackupsRoot(), { recursive: true });
  mkdirSync(path.join(dir, "brand"), { recursive: true });

  for (const [name, data] of Object.entries(fileBodies)) {
    writeFileSync(path.join(dir, name), data);
  }
  for (const { rel, data } of brandRelPaths) {
    writeFileSync(path.join(dir, rel), data);
  }
  writeFileSync(path.join(dir, "manifest.json"), jsonBuf(manifest));
  writeFileSync(zipPath, buffer);
}

export async function createManualBackupPackage(
  session: SodaSession
): Promise<CreateBackupResult> {
  const assembled = await assembleManualBackupPackage(session);
  if ("error" in assembled) {
    return { ok: false, error: assembled.error };
  }

  const { backupId, entry, buffer } = assembled;

  if (!isEphemeralBackupFs()) {
    // Re-assemble file bodies for disk persistence on durable hosts.
    const dir = getBackupDir(backupId);
    const zipPath = getBackupZipPath(backupId);
    if (existsSync(dir) || existsSync(zipPath)) {
      return { ok: false, error: "Backup zip already exists — refused to overwrite." };
    }
    try {
      const [database, storage, assets] = await Promise.all([
        collectDatabaseMetadata(),
        collectStorageMetadata(),
        collectAssetsIndex(),
      ]);
      const migrations = listAppliedMigrationFiles();
      const version = getApplicationVersion();
      const commit = getGitCommit();
      const manifest: BackupManifest = {
        product: "SODA OS",
        version,
        commit,
        createdAt: entry.createdAt,
        backupVersion: BACKUP_VERSION,
        backupId,
        backupType: entry.backupType,
        database: database.status,
        storage: storage.status,
        assets: assets.status,
        migrations,
        creator: {
          userId: session.userId,
          displayName: entry.creatorName,
          email: entry.creatorEmail,
        },
        sizeBytes: buffer.length,
      };
      const fileBodies: Record<string, Buffer> = {
        "database-metadata.json": jsonBuf(database),
        "storage-metadata.json": jsonBuf(storage),
        "assets-index.json": jsonBuf(assets),
        "system-configuration.json": jsonBuf(collectSystemConfiguration()),
        "environment-metadata.json": jsonBuf({
          note: "Presence flags only — values never exported.",
          env: collectSafeEnvMetadata(),
        }),
        "migrations.json": jsonBuf({ migrations }),
        "README.txt": Buffer.from(
          "SODA OS Recovery Metadata Package — see manifest.json",
          "utf8"
        ),
      };
      const brandRelPaths: Array<{ rel: string; data: Buffer }> = [];
      for (const rel of BRAND_RELATIVE_FILES) {
        const abs = path.join(process.cwd(), rel);
        if (!existsSync(abs)) continue;
        try {
          brandRelPaths.push({
            rel: `brand/${path.basename(rel)}`,
            data: readFileSync(abs),
          });
        } catch {
          // skip
        }
      }
      persistBackupPackage(backupId, fileBodies, brandRelPaths, manifest, buffer);
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to persist backup package",
      };
    }
  }

  try {
    appendBackupHistory(entry);
  } catch (err) {
    if (!isEphemeralBackupFs()) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to record backup history",
      };
    }
  }

  return {
    ok: true,
    backupId,
    entry,
    downloadPath: `/api/backup/${encodeURIComponent(backupId)}/download`,
  };
}

/** Same-request ZIP for ephemeral hosts (Vercel) — no disk round-trip. */
export async function streamManualBackupPackage(
  session: SodaSession
): Promise<AssembledBackupPackage | { error: string }> {
  const assembled = await assembleManualBackupPackage(session);
  if ("error" in assembled) return assembled;

  try {
    appendBackupHistory(assembled.entry);
  } catch {
    // History may not persist on ephemeral FS — download still succeeds.
  }

  return assembled;
}
