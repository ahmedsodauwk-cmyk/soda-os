/**
 * Backup history index on local filesystem.
 * Never overwrites an existing backup id / zip (Mission 08.0 Phase 08).
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import {
  getBackupIndexPath,
  getBackupZipPath,
  getBackupsRoot,
} from "@/lib/backup/paths";
import type { BackupHistoryEntry } from "@/lib/backup/types";

/** Write paths only — never call from readBackupIndex (Vercel FS may be read-only). */
function ensureRoot(): void {
  const root = getBackupsRoot();
  if (!existsSync(root)) {
    mkdirSync(root, { recursive: true });
  }
}

/**
 * Read backup history index. Fail-soft: no mkdir; returns [] when missing or FS unavailable.
 */
export function readBackupIndex(): BackupHistoryEntry[] {
  const indexPath = getBackupIndexPath();
  try {
    if (!existsSync(indexPath)) return [];
    const raw = JSON.parse(readFileSync(indexPath, "utf8")) as {
      backups?: BackupHistoryEntry[];
    };
    const list = Array.isArray(raw.backups) ? raw.backups : [];
    return [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export function writeBackupIndex(entries: BackupHistoryEntry[]): void {
  ensureRoot();
  const sorted = [...entries].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  writeFileSync(
    getBackupIndexPath(),
    JSON.stringify({ backups: sorted, updatedAt: new Date().toISOString() }, null, 2),
    "utf8"
  );
}

export function appendBackupHistory(entry: BackupHistoryEntry): void {
  const existing = readBackupIndex();
  if (existing.some((e) => e.id === entry.id)) {
    throw new Error(`Backup id already exists: ${entry.id}`);
  }
  if (existsSync(getBackupZipPath(entry.id))) {
    throw new Error(`Backup zip already exists: ${entry.id}`);
  }
  writeBackupIndex([entry, ...existing]);
}

export function getBackupHistoryEntry(
  id: string
): BackupHistoryEntry | undefined {
  return readBackupIndex().find((e) => e.id === id);
}
