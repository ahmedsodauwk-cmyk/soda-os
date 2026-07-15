/**
 * Backup Center server actions — Founder only (Mission 08.0).
 */

"use server";

import { revalidatePath } from "next/cache";

import { requireBackupFounder } from "@/lib/backup/access";
import { createManualBackupPackage } from "@/lib/backup/package";
import type { BackupHistoryEntry } from "@/lib/backup/types";

export type CreateBackupActionResult = {
  ok: boolean;
  error?: string;
  backupId?: string;
  downloadPath?: string;
  entry?: BackupHistoryEntry;
};

export async function createBackupAction(): Promise<CreateBackupActionResult> {
  const session = await requireBackupFounder();
  if (!session) {
    return { ok: false, error: "Founder access required." };
  }

  const result = await createManualBackupPackage(session);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/settings/backup");
  revalidatePath("/settings");

  return {
    ok: true,
    backupId: result.backupId,
    downloadPath: result.downloadPath,
    entry: result.entry,
  };
}
