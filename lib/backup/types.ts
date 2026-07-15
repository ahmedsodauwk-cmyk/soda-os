/**
 * SODA Backup Center — shared types (Mission 08.0).
 * Packages never include secrets, passwords, API keys, or tokens.
 */

export const BACKUP_VERSION = "1" as const;

export type BackupType =
  | "manual"
  | "automatic"
  | "scheduled"
  | "cloud";

export type HealthStatus = "OK" | "DEGRADED" | "UNKNOWN" | "UNAVAILABLE";

export type BackupManifest = {
  product: "SODA OS";
  version: string;
  commit: string;
  createdAt: string;
  backupVersion: typeof BACKUP_VERSION;
  backupId: string;
  backupType: BackupType;
  database: HealthStatus;
  storage: HealthStatus;
  assets: HealthStatus;
  migrations: string[];
  creator: {
    userId: string;
    displayName: string;
    email: string;
  };
  sizeBytes: number;
};

export type BackupHistoryEntry = {
  id: string;
  createdAt: string;
  sizeBytes: number;
  commit: string;
  version: string;
  creatorName: string;
  creatorEmail: string;
  backupType: BackupType;
  /** Relative path under data/backups for the zip package */
  zipFileName: string;
};

export type BackupDashboardStatus = {
  systemStatus: HealthStatus;
  lastBackupAt: string | null;
  totalBackups: number;
  totalSizeBytes: number;
  gitCommit: string;
  applicationVersion: string;
  lastDatabaseMigration: string | null;
  storageStatus: HealthStatus;
  assetsStatus: HealthStatus;
  databaseStatus: HealthStatus;
  /** True when filesystem persistence may be ephemeral (e.g. Vercel serverless). */
  ephemeralStorage: boolean;
};

export type EnvPresence = Record<string, { present: boolean }>;

export type DatabaseMetadata = {
  status: HealthStatus;
  configured: boolean;
  supabaseHost: string | null;
  tables: Array<{ name: string; rowCount: number | null }>;
  note: string;
};

export type StorageMetadata = {
  status: HealthStatus;
  buckets: Array<{
    id: string;
    name: string;
    public: boolean;
    createdAt: string | null;
  }>;
  note: string;
};

export type AssetsIndex = {
  status: HealthStatus;
  brandFiles: Array<{ path: string; sizeBytes: number }>;
  uploadedFiles: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    storageKey?: string;
    projectId?: string;
    orderId?: string;
    updatedAt: string;
  }>;
  uploadedFileCount: number;
};

export type SystemConfiguration = {
  product: "SODA OS";
  brand: "SODA VISUALS";
  applicationVersion: string;
  gitCommit: string;
  nodeEnv: string | null;
  vercelEnv: string | null;
  siteUrlConfigured: boolean;
};

/** Future cloud / remote destinations — stubs only (Mission 08.0 Phase 09). */
export type BackupCloudProviderId =
  | "google_drive"
  | "onedrive"
  | "s3"
  | "nas";

export type BackupCloudProvider = {
  id: BackupCloudProviderId;
  label: string;
  /** Always false until a later mission implements the provider. */
  implemented: false;
  description: string;
};
