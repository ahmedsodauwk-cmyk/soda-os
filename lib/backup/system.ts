/**
 * Collect system / application status for Backup Center dashboard + packages.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { createDomainDb } from "@/lib/supabase/domain-db";
import {
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import type {
  AssetsIndex,
  DatabaseMetadata,
  HealthStatus,
  StorageMetadata,
  SystemConfiguration,
} from "@/lib/backup/types";

const BRAND_RELATIVE_FILES = [
  "public/brand/soda-logo.png",
  "public/brand/soda-logo.svg",
  "public/brand/soda-icon.png",
  "public/brand/favicon-32.png",
  "public/brand/apple-touch-icon.png",
  "public/brand/og-image.png",
  "public/brand/pwa-192.png",
  "public/brand/pwa-512.png",
] as const;

const KNOWN_TABLES = [
  "profiles",
  "clients",
  "orders",
  "projects",
  "files",
  "people",
  "crew_members",
] as const;

export function getApplicationVersion(): string {
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
      version?: string;
    };
    return pkg.version?.trim() || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function getGitCommit(): string {
  const fromEnv =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GIT_COMMIT?.trim() ||
    process.env.COMMIT_SHA?.trim();
  if (fromEnv) return fromEnv.slice(0, 40);

  try {
    const headPath = path.join(process.cwd(), ".git", "HEAD");
    if (!existsSync(headPath)) return "unknown";
    const head = readFileSync(headPath, "utf8").trim();
    if (head.startsWith("ref:")) {
      const ref = head.slice(4).trim();
      const refPath = path.join(process.cwd(), ".git", ref);
      if (existsSync(refPath)) {
        return readFileSync(refPath, "utf8").trim().slice(0, 40);
      }
    }
    return head.slice(0, 40) || "unknown";
  } catch {
    return "unknown";
  }
}

export function listAppliedMigrationFiles(): string[] {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export function getLastMigrationName(): string | null {
  const list = listAppliedMigrationFiles();
  return list.length ? list[list.length - 1]! : null;
}

export function collectSystemConfiguration(): SystemConfiguration {
  return {
    product: "SODA OS",
    brand: "SODA VISUALS",
    applicationVersion: getApplicationVersion(),
    gitCommit: getGitCommit(),
    nodeEnv: process.env.NODE_ENV ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    siteUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
  };
}

function supabaseHostLabel(): string | null {
  const url = getSupabaseUrl();
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return "configured";
  }
}

export async function collectDatabaseMetadata(): Promise<DatabaseMetadata> {
  if (!isSupabaseConfigured()) {
    return {
      status: "UNAVAILABLE",
      configured: false,
      supabaseHost: null,
      tables: [],
      note: "Supabase env not configured — no database metadata collected.",
    };
  }

  const tables: DatabaseMetadata["tables"] = [];
  let okCount = 0;

  try {
    const db = createDomainDb();
    for (const name of KNOWN_TABLES) {
      try {
        const { count, error } = await db
          .from(name)
          .select("*", { count: "exact", head: true });
        if (error) {
          tables.push({ name, rowCount: null });
        } else {
          tables.push({ name, rowCount: count ?? 0 });
          okCount += 1;
        }
      } catch {
        tables.push({ name, rowCount: null });
      }
    }
  } catch {
    return {
      status: "DEGRADED",
      configured: true,
      supabaseHost: supabaseHostLabel(),
      tables: [],
      note: "Database client failed — metadata incomplete. No row data exported.",
    };
  }

  const status: HealthStatus =
    okCount === 0 ? "DEGRADED" : okCount < KNOWN_TABLES.length ? "DEGRADED" : "OK";

  return {
    status,
    configured: true,
    supabaseHost: supabaseHostLabel(),
    tables,
    note: "Metadata only — table names and counts. No row payloads or secrets.",
  };
}

export async function collectStorageMetadata(): Promise<StorageMetadata> {
  if (!isSupabaseConfigured()) {
    return {
      status: "UNAVAILABLE",
      buckets: [],
      note: "Supabase not configured — storage metadata unavailable.",
    };
  }

  try {
    const db = createDomainDb();
    const { data, error } = await db.storage.listBuckets();
    if (error) {
      return {
        status: "DEGRADED",
        buckets: [],
        note: `Storage list failed: ${error.message}. Bucket names only when available.`,
      };
    }
    const buckets = (data ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      public: Boolean(b.public),
      createdAt: b.created_at ?? null,
    }));
    return {
      status: "OK",
      buckets,
      note: "Bucket metadata only — no object bytes or credentials.",
    };
  } catch (err) {
    return {
      status: "DEGRADED",
      buckets: [],
      note: `Storage probe error: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
}

export async function collectAssetsIndex(): Promise<AssetsIndex> {
  const brandFiles: AssetsIndex["brandFiles"] = [];
  for (const rel of BRAND_RELATIVE_FILES) {
    const abs = path.join(process.cwd(), rel);
    if (!existsSync(abs)) continue;
    try {
      brandFiles.push({ path: rel, sizeBytes: statSync(abs).size });
    } catch {
      // skip
    }
  }

  let uploadedFiles: AssetsIndex["uploadedFiles"] = [];
  let uploadedFileCount = 0;

  if (isSupabaseConfigured()) {
    try {
      const db = createDomainDb();
      const { data, error, count } = await db
        .from("files")
        .select(
          "id, name, type, size, storage_key, project_id, order_id, updated_at",
          { count: "exact" }
        )
        .order("updated_at", { ascending: false })
        .limit(500);

      if (!error && data) {
        uploadedFileCount = count ?? data.length;
        uploadedFiles = data.map((row) => {
          const r = row as Record<string, unknown>;
          return {
            id: String(r.id ?? ""),
            name: String(r.name ?? ""),
            type: String(r.type ?? ""),
            size: String(r.size ?? ""),
            ...(r.storage_key
              ? { storageKey: String(r.storage_key) }
              : {}),
            ...(r.project_id ? { projectId: String(r.project_id) } : {}),
            ...(r.order_id ? { orderId: String(r.order_id) } : {}),
            updatedAt: String(r.updated_at ?? ""),
          };
        });
      }
    } catch {
      // keep empty index
    }
  }

  const status: HealthStatus =
    brandFiles.length > 0
      ? "OK"
      : uploadedFileCount > 0
        ? "DEGRADED"
        : "UNKNOWN";

  return {
    status,
    brandFiles,
    uploadedFiles,
    uploadedFileCount,
  };
}

export { BRAND_RELATIVE_FILES };
