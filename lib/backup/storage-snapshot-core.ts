/**
 * Shared Storage snapshot builder (Mission 08.3 / 08.3.1).
 * Never writes secrets into the package.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { buildZipBuffer } from "@/lib/backup/zip";

const PRODUCT = "SODA OS";
const LOCAL_ASSET_ROOTS = ["public"] as const;

export type BackupMode = "service_role" | "anon" | "dry_validate";
export type BackupStatus = "SUCCESS" | "FAILED";

export type Validation = {
  readable: boolean;
  manifestValid: boolean;
  folderStructureValid: boolean;
  integrityValid: boolean;
  serviceRoleRequired: boolean;
  bucketEnumerationOk: boolean;
  downloadsReported: boolean;
};

export type Manifest = {
  product: string;
  brand: string;
  backupStatus: BackupStatus;
  mode: BackupMode;
  projectReference: string;
  bucketCount: number;
  objectCount: number;
  folderCount: number;
  storageSize: number;
  failedObjectCount: number;
  checksum: string;
  createdAt: string;
  gitCommit: string;
  applicationVersion: string;
  backupSize: number;
  outputFile: string;
  limitations: string[];
  validation: Validation;
};

export type ArchiveEntry = { name: string; data: Buffer };

type ObjectMeta = {
  bucket: string;
  path: string;
  size: number;
  contentType?: string | null;
  updatedAt?: string | null;
  etag?: string | null;
};

type BucketMeta = {
  id: string;
  name: string;
  public: boolean;
  createdAt: string | null;
};

export type StorageSnapshotResult = {
  zipBuffer: Buffer;
  manifest: Manifest;
  fileName: string;
};

function dateStamp(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function projectRefFromUrl(url: string | undefined): string {
  if (!url?.trim()) return "unknown";
  try {
    const host = new URL(url.trim()).hostname;
    const m = /^([a-z0-9-]+)\.supabase\.co$/i.exec(host);
    return m?.[1] ?? host;
  } catch {
    return "unknown";
  }
}

export function readPackageVersion(repoRoot: string): string {
  try {
    const pkg = JSON.parse(
      readFileSync(path.join(repoRoot, "package.json"), "utf8")
    ) as { version?: string };
    return pkg.version?.trim() || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function git(repoRoot: string, args: string[]): string | null {
  const r = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (r.status !== 0) return null;
  return (r.stdout || "").trim() || null;
}

export function getGitCommit(repoRoot: string): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GIT_COMMIT?.trim() ||
    git(repoRoot, ["rev-parse", "HEAD"]) ||
    "unknown"
  );
}

function collectLocalAssetEntries(repoRoot: string): {
  entries: ArchiveEntry[];
  objectCount: number;
  folderCount: number;
  storageSize: number;
} {
  const entries: ArchiveEntry[] = [];
  const folders = new Set<string>();
  let objectCount = 0;
  let storageSize = 0;

  function walk(absDir: string, relPosix: string) {
    let names: string[];
    try {
      names = readdirSync(absDir);
    } catch {
      return;
    }
    for (const name of names) {
      if (name === ".DS_Store" || name === "Thumbs.db") continue;
      const abs = path.join(absDir, name);
      const rel = relPosix ? `${relPosix}/${name}` : name;
      const relPosixPath = rel.replace(/\\/g, "/");
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        folders.add(`local/${relPosixPath}`);
        walk(abs, relPosixPath);
      } else if (st.isFile()) {
        const data = readFileSync(abs);
        entries.push({ name: `local/${relPosixPath}`, data });
        objectCount += 1;
        storageSize += data.length;
        const parent = path.posix.dirname(`local/${relPosixPath}`);
        if (parent && parent !== ".") folders.add(parent);
      }
    }
  }

  for (const root of LOCAL_ASSET_ROOTS) {
    const abs = path.join(repoRoot, root);
    if (!existsSync(abs)) continue;
    folders.add(`local/${root}`);
    walk(abs, root);
  }

  return { entries, objectCount, folderCount: folders.size, storageSize };
}

type StorageListClient = {
  storage: {
    from: (bucket: string) => {
      list: (
        path: string,
        opts: {
          limit: number;
          offset: number;
          sortBy: { column: string; order: string };
        }
      ) => Promise<{
        data: Array<{
          id: string | null;
          name: string;
          updated_at?: string | null;
          metadata?: {
            size?: number | string;
            mimetype?: string;
            eTag?: string;
            etag?: string;
          } | null;
        }> | null;
        error: { message: string } | null;
      }>;
      download: (path: string) => Promise<{
        data: Blob | null;
        error: { message: string } | null;
      }>;
    };
    listBuckets: () => Promise<{
      data: Array<{
        id: string;
        name: string;
        public: boolean;
        created_at?: string | null;
      }> | null;
      error: { message: string } | null;
    }>;
  };
};

async function listAllInBucket(
  client: StorageListClient,
  bucket: string
): Promise<ObjectMeta[]> {
  const out: ObjectMeta[] = [];
  const queue: string[] = [""];

  while (queue.length) {
    const prefix = queue.shift()!;
    let offset = 0;
    for (;;) {
      const { data, error } = await client.storage.from(bucket).list(prefix, {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) {
        throw new Error(`${bucket}/${prefix || "(root)"}: ${error.message}`);
      }
      const items = data ?? [];
      if (!items.length) break;

      for (const item of items) {
        const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null) {
          queue.push(fullPath);
          continue;
        }
        const size =
          typeof item.metadata?.size === "number"
            ? item.metadata.size
            : typeof item.metadata?.size === "string"
              ? Number(item.metadata.size) || 0
              : 0;
        out.push({
          bucket,
          path: fullPath,
          size,
          contentType: item.metadata?.mimetype ?? null,
          updatedAt: item.updated_at ?? null,
          etag: item.metadata?.eTag ?? item.metadata?.etag ?? null,
        });
      }

      if (items.length < 100) break;
      offset += items.length;
    }
  }

  return out;
}

async function fetchStorageViaSupabase(
  url: string,
  key: string,
  mode: "service_role" | "anon"
): Promise<{
  buckets: BucketMeta[];
  objects: ObjectMeta[];
  entries: ArchiveEntry[];
  folderCount: number;
  storageSize: number;
  objectCount: number;
  failedObjectCount: number;
  bucketEnumerationOk: boolean;
  limitations: string[];
}> {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as StorageListClient;

  const limitations: string[] = [];
  const entries: ArchiveEntry[] = [];
  const folders = new Set<string>();
  let storageSize = 0;
  let objectCount = 0;
  let failedObjectCount = 0;
  let bucketEnumerationOk = false;

  const { data: bucketRows, error: listErr } = await client.storage.listBuckets();
  if (listErr) {
    limitations.push(`listBuckets failed: ${listErr.message}`);
    if (mode === "service_role") {
      return {
        buckets: [],
        objects: [],
        entries,
        folderCount: 0,
        storageSize: 0,
        objectCount: 0,
        failedObjectCount: 0,
        bucketEnumerationOk: false,
        limitations,
      };
    }
  } else {
    bucketEnumerationOk = true;
  }

  let buckets: BucketMeta[] = (bucketRows ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    public: Boolean(b.public),
    createdAt: b.created_at ?? null,
  }));

  if (!buckets.length && mode === "anon") {
    const known = ["soda-files", "connect"];
    limitations.push(
      `listBuckets empty — probing known buckets: ${known.join(", ")}`
    );
    for (const name of known) {
      const { error } = await client.storage.from(name).list("", {
        limit: 1,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });
      if (!error) {
        buckets.push({
          id: name,
          name,
          public: false,
          createdAt: null,
        });
      }
    }
  }

  const objects: ObjectMeta[] = [];

  for (const b of buckets) {
    folders.add(`storage/buckets/${b.name}`);
    try {
      const listed = await listAllInBucket(client, b.name);
      for (const obj of listed) {
        objects.push(obj);
        const parts = obj.path.split("/");
        let acc = `storage/buckets/${b.name}`;
        for (let i = 0; i < parts.length - 1; i++) {
          acc += `/${parts[i]}`;
          folders.add(acc);
        }
      }
    } catch (err) {
      limitations.push(
        `list ${b.name}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  for (const obj of objects) {
    try {
      const { data, error } = await client.storage
        .from(obj.bucket)
        .download(obj.path);
      if (error || !data) {
        failedObjectCount += 1;
        limitations.push(
          `download ${obj.bucket}/${obj.path}: ${error?.message ?? "empty"}`
        );
        continue;
      }
      const buf = Buffer.from(await data.arrayBuffer());
      entries.push({
        name: `storage/buckets/${obj.bucket}/${obj.path}`,
        data: buf,
      });
      objectCount += 1;
      storageSize += buf.length;
      obj.size = buf.length;
    } catch (err) {
      failedObjectCount += 1;
      limitations.push(
        `download ${obj.bucket}/${obj.path}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  entries.push({
    name: "storage/metadata/buckets.json",
    data: Buffer.from(`${JSON.stringify({ mode, buckets }, null, 2)}\n`, "utf8"),
  });
  entries.push({
    name: "storage/metadata/objects.json",
    data: Buffer.from(
      `${JSON.stringify(
        {
          note: "Object index — no credentials. Bytes under storage/buckets/.",
          count: objects.length,
          downloaded: objectCount,
          failed: failedObjectCount,
          objects,
        },
        null,
        2
      )}\n`,
      "utf8"
    ),
  });

  if (mode === "anon") {
    limitations.push(
      "Anon key mode — private bucket objects may be incomplete; prefer SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return {
    buckets,
    objects,
    entries,
    folderCount: folders.size,
    storageSize,
    objectCount,
    failedObjectCount,
    bucketEnumerationOk,
    limitations,
  };
}

function payloadChecksum(entries: ArchiveEntry[]): string {
  const hash = createHash("sha256");
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  for (const e of sorted) {
    hash.update(e.name);
    hash.update(e.data);
  }
  return `sha256:${hash.digest("hex")}`;
}

export function sha256(buf: Buffer): string {
  return `sha256:${createHash("sha256").update(buf).digest("hex")}`;
}

function buildPackage(
  manifest: Manifest,
  contentEntries: ArchiveEntry[]
): Buffer {
  return buildZipBuffer([
    {
      name: "manifest.json",
      data: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
    },
    ...contentEntries,
  ]);
}

export function assertNoSecretsInEntries(entries: ArchiveEntry[]): string[] {
  const hits: string[] = [];
  const forbidden = [
    /SUPABASE_SERVICE_ROLE/i,
    /SERVICE_ROLE_KEY/i,
    /BEGIN (RSA |OPENSSH )?PRIVATE KEY/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./,
  ];
  for (const e of entries) {
    if (e.name.endsWith(".env") || e.name.includes(".env.")) {
      hits.push(`secret path: ${e.name}`);
      continue;
    }
    if (e.data.length > 64_000) continue;
    if (!/\.(json|md|txt|csv)$/i.test(e.name) && e.name !== "LIMITATIONS.md") {
      continue;
    }
    const text = e.data.toString("utf8");
    for (const re of forbidden) {
      if (re.test(text)) {
        hits.push(`secret pattern in ${e.name}`);
        break;
      }
    }
  }
  return hits;
}

function zipLooksReadable(buf: Buffer): boolean {
  return buf.length >= 22 && buf.readUInt32LE(0) === 0x04034b50;
}

function parseZipEntries(buf: Buffer): ArchiveEntry[] {
  const out: ArchiveEntry[] = [];
  let offset = 0;
  while (offset + 30 <= buf.length) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameStart = offset + 30;
    const name = buf.subarray(nameStart, nameStart + nameLen).toString("utf8");
    const dataStart = nameStart + nameLen + extraLen;
    if (dataStart + compSize > buf.length) break;
    out.push({
      name,
      data: buf.subarray(dataStart, dataStart + compSize),
    });
    offset = dataStart + compSize;
  }
  return out;
}

function requiredManifestFields(m: Record<string, unknown>): boolean {
  const keys = [
    "bucketCount",
    "objectCount",
    "folderCount",
    "storageSize",
    "failedObjectCount",
    "projectReference",
    "checksum",
    "createdAt",
    "gitCommit",
    "applicationVersion",
    "backupStatus",
    "mode",
  ];
  return keys.every((k) => m[k] !== undefined && m[k] !== null);
}

export function verifyZipBuffer(
  buf: Buffer,
  contentEntries: ArchiveEntry[]
): Validation & { ok: boolean } {
  const readable = zipLooksReadable(buf);
  const zipped = parseZipEntries(buf);
  const names = zipped.map((z) => z.name);

  const folderStructureValid =
    names.includes("manifest.json") &&
    (names.some((n) => n.startsWith("local/")) ||
      names.some((n) => n.startsWith("storage/")));

  const everyFileReadable =
    readable &&
    contentEntries.every((e) => {
      const z = zipped.find((x) => x.name === e.name);
      return Boolean(z && z.data.length === e.data.length);
    });

  const integrityValid =
    folderStructureValid &&
    everyFileReadable &&
    names.includes("manifest.json");

  let manifestValid = false;
  let serviceRoleRequired = false;
  let bucketEnumerationOk = false;
  let downloadsReported = false;
  const man = zipped.find((z) => z.name === "manifest.json");
  if (man) {
    try {
      const m = JSON.parse(man.data.toString("utf8")) as Manifest;
      serviceRoleRequired = m.mode === "service_role";
      bucketEnumerationOk = Boolean(m.validation?.bucketEnumerationOk);
      downloadsReported =
        typeof m.failedObjectCount === "number" && m.failedObjectCount >= 0;
      manifestValid =
        requiredManifestFields(m as unknown as Record<string, unknown>) &&
        typeof m.checksum === "string" &&
        m.checksum.startsWith("sha256:") &&
        (m.backupStatus === "SUCCESS" || m.backupStatus === "FAILED");
    } catch {
      manifestValid = false;
    }
  }

  const validation: Validation = {
    readable: everyFileReadable,
    manifestValid,
    folderStructureValid,
    integrityValid,
    serviceRoleRequired,
    bucketEnumerationOk,
    downloadsReported,
  };

  const ok =
    validation.readable &&
    validation.manifestValid &&
    validation.folderStructureValid &&
    validation.integrityValid &&
    validation.serviceRoleRequired &&
    validation.bucketEnumerationOk &&
    validation.downloadsReported;

  return { ...validation, ok };
}

export type BuildSnapshotOptions = {
  repoRoot: string;
  dryValidate?: boolean;
  /** When true, refuse anon/dry paths (Mission 08.3.1 live backup). */
  requireServiceRole?: boolean;
  outputFileName?: string;
};

/**
 * Build a Storage snapshot ZIP in memory.
 * With requireServiceRole=true, fails hard unless service_role credentials exist.
 */
export async function buildStorageSnapshot(
  opts: BuildSnapshotOptions
): Promise<StorageSnapshotResult> {
  const repoRoot = opts.repoRoot;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const hasServiceRole = Boolean(url && serviceKey);
  const hasAnon = Boolean(url && anonKey);
  const dryValidate =
    Boolean(opts.dryValidate) || (!hasServiceRole && !hasAnon);

  if (opts.requireServiceRole && !hasServiceRole) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL required for live storage backup."
    );
  }

  const createdAt = new Date().toISOString();
  const stamp = dateStamp(new Date(createdAt));
  const applicationVersion = readPackageVersion(repoRoot);
  const gitCommit = getGitCommit(repoRoot);
  const fileName = opts.outputFileName ?? `SODA_Storage_${stamp}.zip`;
  const projectReference = projectRefFromUrl(url);

  const limitations: string[] = [];
  const contentEntries: ArchiveEntry[] = [];
  let mode: BackupMode = "dry_validate";
  let bucketCount = 0;
  let objectCount = 0;
  let folderCount = 0;
  let storageSize = 0;
  let failedObjectCount = 0;
  let bucketEnumerationOk = false;

  const local = collectLocalAssetEntries(repoRoot);
  contentEntries.push(...local.entries);
  objectCount += local.objectCount;
  folderCount += local.folderCount;
  storageSize += local.storageSize;

  contentEntries.push({
    name: "storage/metadata/architecture_stubs.json",
    data: Buffer.from(
      `${JSON.stringify(
        {
          note: "Future-ready stubs only — not implemented in this mission.",
          stubs: [
            "IncrementalStorageBackup",
            "CloudReplication",
            "MultiBucketBackup",
          ],
          module: "lib/backup/storage-protection-stubs.ts",
        },
        null,
        2
      )}\n`,
      "utf8"
    ),
  });

  if (opts.requireServiceRole || hasServiceRole) {
    mode = "service_role";
    if (!hasServiceRole) {
      throw new Error("service_role credentials missing");
    }
    const remote = await fetchStorageViaSupabase(
      url!,
      serviceKey!,
      "service_role"
    );
    contentEntries.push(...remote.entries);
    bucketCount = remote.buckets.length;
    objectCount += remote.objectCount;
    folderCount += remote.folderCount;
    storageSize += remote.storageSize;
    failedObjectCount = remote.failedObjectCount;
    bucketEnumerationOk = remote.bucketEnumerationOk;
    limitations.push(...remote.limitations);
    if (!bucketEnumerationOk) {
      limitations.push("Bucket enumeration failed — backup incomplete.");
    }
  } else if (dryValidate) {
    mode = "dry_validate";
    limitations.push(
      "Dry validation / no usable Storage API credentials — packaged local public/brand assets + packaging checks only."
    );
    contentEntries.push({
      name: "storage/DRY_VALIDATE.txt",
      data: Buffer.from(
        "Dry validate mode — no live Supabase Storage download was performed.\n",
        "utf8"
      ),
    });
    contentEntries.push({
      name: "storage/metadata/buckets.json",
      data: Buffer.from(
        `${JSON.stringify({ mode, buckets: [] }, null, 2)}\n`,
        "utf8"
      ),
    });
  } else if (hasAnon) {
    mode = "anon";
    const remote = await fetchStorageViaSupabase(url!, anonKey!, "anon");
    contentEntries.push(...remote.entries);
    bucketCount = remote.buckets.length;
    objectCount += remote.objectCount;
    folderCount += remote.folderCount;
    storageSize += remote.storageSize;
    failedObjectCount = remote.failedObjectCount;
    bucketEnumerationOk = remote.bucketEnumerationOk;
    limitations.push(...remote.limitations);
  }

  const secretHits = assertNoSecretsInEntries(contentEntries);
  if (secretHits.length) {
    throw new Error(`Refused packaging secrets: ${secretHits.join("; ")}`);
  }

  if (limitations.length) {
    contentEntries.push({
      name: "LIMITATIONS.md",
      data: Buffer.from(
        `# Storage backup limitations\n\n${limitations.map((l) => `- ${l}`).join("\n")}\n`,
        "utf8"
      ),
    });
  }

  const checksum = payloadChecksum(contentEntries);
  const downloadsReported = true;

  let backupStatus: BackupStatus = "FAILED";
  if (
    mode === "service_role" &&
    bucketEnumerationOk &&
    failedObjectCount === 0 &&
    local.objectCount > 0
  ) {
    backupStatus = "SUCCESS";
  }

  // Anon / dry_validate can never claim SUCCESS (Mission 08.3.1).
  if (mode !== "service_role") {
    backupStatus = "FAILED";
  }

  const provisionalValidation: Validation = {
    readable: true,
    manifestValid: true,
    folderStructureValid:
      contentEntries.some((e) => e.name.startsWith("local/")) ||
      contentEntries.some((e) => e.name.startsWith("storage/")),
    integrityValid: true,
    serviceRoleRequired: mode === "service_role",
    bucketEnumerationOk,
    downloadsReported,
  };

  const manifest: Manifest = {
    product: PRODUCT,
    brand: "SODA VISUALS",
    backupStatus,
    mode,
    projectReference,
    bucketCount,
    objectCount,
    folderCount,
    storageSize,
    failedObjectCount,
    checksum,
    createdAt,
    gitCommit,
    applicationVersion,
    backupSize: 0,
    outputFile: fileName,
    limitations,
    validation: provisionalValidation,
  };

  let zipBuf = buildPackage(manifest, contentEntries);
  manifest.backupSize = zipBuf.length;
  zipBuf = buildPackage(manifest, contentEntries);

  const verified = verifyZipBuffer(zipBuf, contentEntries);
  if (!verified.ok || mode !== "service_role" || !bucketEnumerationOk) {
    manifest.backupStatus = "FAILED";
    manifest.validation = {
      readable: verified.readable,
      manifestValid: verified.manifestValid,
      folderStructureValid: verified.folderStructureValid,
      integrityValid: verified.integrityValid,
      serviceRoleRequired: mode === "service_role",
      bucketEnumerationOk,
      downloadsReported,
    };
  } else if (failedObjectCount > 0) {
    manifest.backupStatus = "FAILED";
    manifest.validation = {
      ...verified,
      serviceRoleRequired: true,
      bucketEnumerationOk,
      downloadsReported: true,
    };
  } else {
    manifest.backupStatus = "SUCCESS";
    manifest.validation = {
      readable: true,
      manifestValid: true,
      folderStructureValid: true,
      integrityValid: true,
      serviceRoleRequired: true,
      bucketEnumerationOk: true,
      downloadsReported: true,
    };
  }

  zipBuf = buildPackage(manifest, contentEntries);
  manifest.backupSize = zipBuf.length;
  zipBuf = buildPackage(manifest, contentEntries);

  const finalCheck = verifyZipBuffer(zipBuf, contentEntries);
  if (!finalCheck.ok && manifest.backupStatus === "SUCCESS") {
    manifest.backupStatus = "FAILED";
    manifest.validation = finalCheck;
    zipBuf = buildPackage(manifest, contentEntries);
    manifest.backupSize = zipBuf.length;
    zipBuf = buildPackage(manifest, contentEntries);
  }

  return { zipBuffer: zipBuf, manifest, fileName };
}
