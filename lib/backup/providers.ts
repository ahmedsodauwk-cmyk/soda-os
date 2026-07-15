/**
 * Cloud / remote backup provider stubs (Mission 08.0 Phase 09).
 * DO NOT implement — interfaces only for future readiness.
 */

import type { BackupCloudProvider } from "@/lib/backup/types";

export const BACKUP_CLOUD_PROVIDERS: readonly BackupCloudProvider[] = [
  {
    id: "google_drive",
    label: "Google Drive",
    implemented: false,
    description: "Push encrypted packages to a Founder Drive folder.",
  },
  {
    id: "onedrive",
    label: "OneDrive",
    implemented: false,
    description: "Sync packages to Microsoft OneDrive for Business.",
  },
  {
    id: "s3",
    label: "Amazon S3",
    implemented: false,
    description: "Store packages in an S3-compatible object bucket.",
  },
  {
    id: "nas",
    label: "NAS / Private Volume",
    implemented: false,
    description: "Write packages to a mounted network volume.",
  },
] as const;

/** Future interface — providers must not export secrets into packages. */
export interface BackupCloudUploadTarget {
  providerId: BackupCloudProvider["id"];
  /** Opaque remote folder / bucket key — never credentials. */
  destinationRef: string;
}

export interface BackupCloudProviderAdapter {
  readonly provider: BackupCloudProvider;
  /** Always throws until implemented. */
  upload(_localZipPath: string, _target: BackupCloudUploadTarget): Promise<never>;
  list(_target: BackupCloudUploadTarget): Promise<never>;
}

export function getCloudProviderStub(
  id: BackupCloudProvider["id"]
): BackupCloudProvider {
  const found = BACKUP_CLOUD_PROVIDERS.find((p) => p.id === id);
  if (!found) {
    throw new Error(`Unknown backup cloud provider: ${id}`);
  }
  return found;
}
