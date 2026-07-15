/**
 * Mission 08.3 — Storage protection architecture stubs (future-ready).
 *
 * Interfaces only — do not implement Incremental / Cloud Replication /
 * Multi-Bucket flows here. See docs/SODA_MASTER/SOURCE_PROTECTION.md.
 */

/** Point-in-time full snapshot (implemented by create-storage-snapshot). */
export type FullStorageBackupPlan = {
  mode: "full";
  includeLocalPublic: boolean;
  includeSupabaseBuckets: boolean;
};

/**
 * Incremental Storage Backup — future.
 * Diff objects by etag / updated_at since last successful manifest.
 */
export type IncrementalStorageBackupPlan = {
  mode: "incremental";
  /** Prior SODA_Storage_*.manifest.json path or checksum reference. */
  baselineManifestRef: string;
  sinceIso?: string;
};

/**
 * Cloud Replication — future.
 * Mirror a validated package to an external provider (never embed credentials).
 */
export type CloudReplicationTarget = {
  provider: "s3_compatible" | "gcs" | "azure_blob" | "custom";
  /** Opaque destination id — bucket name / URI template without secrets. */
  destinationRef: string;
  verifyAfterUpload: boolean;
};

export type CloudReplicationPlan = {
  sourcePackagePath: string;
  targets: CloudReplicationTarget[];
};

/**
 * Multi-Bucket Backup — future.
 * Explicit bucket allow/deny for large tenants / staged runs.
 */
export type MultiBucketBackupPlan = {
  mode: "multi_bucket";
  includeBuckets?: string[];
  excludeBuckets?: string[];
  parallelDownloads?: number;
};

export type StorageProtectionPlan =
  | FullStorageBackupPlan
  | IncrementalStorageBackupPlan
  | MultiBucketBackupPlan;

/** Reserved entrypoints — not implemented. */
export type StorageProtectionFutureApi = {
  planIncremental(baseline: string): IncrementalStorageBackupPlan;
  planCloudReplication(
    packagePath: string,
    targets: CloudReplicationTarget[]
  ): CloudReplicationPlan;
  planMultiBucket(opts: Omit<MultiBucketBackupPlan, "mode">): MultiBucketBackupPlan;
};
