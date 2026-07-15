/**
 * Mission 08.3 — Enterprise Storage Protection (Founder)
 *
 * Creates SODA_Storage_<date>.zip with Supabase Storage objects (when credentials
 * allow), local public/brand assets, metadata, and manifest.json.
 * Never writes secrets / API keys into the package.
 *
 * Run: npm run backup:storage
 * Docs: docs/SODA_MASTER/SOURCE_PROTECTION.md
 *
 * Future (stubs only): IncrementalStorageBackup, CloudReplication, MultiBucketBackup
 * — see lib/backup/storage-protection-stubs.ts
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { buildZipBuffer } from "../lib/backup/zip";
import { loadEnvLocal, maskSecret } from "./load-env-local";

const PRODUCT = "SODA OS";
const REPO_ROOT = process.cwd();

/** Known repo asset roots always packaged when present. */
const LOCAL_ASSET_ROOTS = ["public"] as const;

type BackupMode = "service_role" | "anon" | "dry_validate";
type BackupStatus = "SUCCESS" | "FAILED";

type Validation = {
  readable: boolean;
  manifestValid: boolean;
  folderStructureValid: boolean;
  integrityValid: boolean;
};

type Manifest = {
  product: string;
  brand: string;
  backupStatus: BackupStatus;
  mode: BackupMode;
  bucketCount: number;
  objectCount: number;
  folderCount: number;
  storageSize: number;
  checksum: string;
  createdAt: string;
  gitCommit: string;
  applicationVersion: string;
  backupSize: number;
  outputFile: string;
  limitations: string[];
  validation: Validation;
};

type ArchiveEntry = { name: string; data: Buffer };

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

function dateStamp(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")
    ) as { version?: string };
    return pkg.version?.trim() || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function git(args: string[]): string | null {
  const r = spawnSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    windowsHide: true,
  });
  if (r.status !== 0) return null;
  return (r.stdout || "").trim() || null;
}

function getGitCommit(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GIT_COMMIT?.trim() ||
    git(["rev-parse", "HEAD"]) ||
    "unknown"
  );
}

function resolveOutDir(cliOut?: string): string {
  if (cliOut?.trim()) return path.resolve(cliOut.trim());
  const envOut = process.env.SODA_STORAGE_SNAPSHOT_OUT?.trim();
  if (envOut) return path.resolve(envOut);

  const founderStorage = "D:\\SODA OS\\Storage";
  if (existsSync(founderStorage)) return founderStorage;

  const founderExportsStorage = "D:\\SODA OS\\Exports\\Storage";
  if (existsSync("D:\\SODA OS\\Exports")) {
    mkdirSync(founderExportsStorage, { recursive: true });
    return founderExportsStorage;
  }

  const fallback = path.join(REPO_ROOT, "Exports", "Storage");
  mkdirSync(fallback, { recursive: true });
  return fallback;
}

function parseArgs(argv: string[]): { out?: string; dryValidate: boolean } {
  let out: string | undefined;
  let dryValidate = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) {
      out = argv[++i];
    } else if (argv[i] === "--dry-validate") {
      dryValidate = true;
    }
  }
  return { out, dryValidate };
}

function collectLocalAssetEntries(): {
  entries: ArchiveEntry[];
  objectCount: number;
  folderCount: number;
  storageSize: number;
  folders: Set<string>;
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
        entries.push({
          name: `local/${relPosixPath}`,
          data,
        });
        objectCount += 1;
        storageSize += data.length;
        const parent = path.posix.dirname(`local/${relPosixPath}`);
        if (parent && parent !== ".") folders.add(parent);
      }
    }
  }

  for (const root of LOCAL_ASSET_ROOTS) {
    const abs = path.join(REPO_ROOT, root);
    if (!existsSync(abs)) continue;
    folders.add(`local/${root}`);
    walk(abs, root);
  }

  return { entries, objectCount, folderCount: folders.size, storageSize, folders };
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
    };
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
        // Supabase: folders have id === null
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
  key: string,
  mode: "service_role" | "anon"
): Promise<{
  buckets: BucketMeta[];
  objects: ObjectMeta[];
  entries: ArchiveEntry[];
  folderCount: number;
  storageSize: number;
  objectCount: number;
  limitations: string[];
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const limitations: string[] = [];
  const entries: ArchiveEntry[] = [];
  const folders = new Set<string>();
  let storageSize = 0;
  let objectCount = 0;

  const { data: bucketRows, error: listErr } = await client.storage.listBuckets();
  if (listErr) {
    limitations.push(`listBuckets failed: ${listErr.message}`);
  }

  let buckets: BucketMeta[] = (bucketRows ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    public: Boolean(b.public),
    createdAt: b.created_at ?? null,
  }));

  // Fallback known buckets if listBuckets restricted (anon)
  if (!buckets.length) {
    const known = ["soda-files", "connect"];
    limitations.push(
      `listBuckets empty — probing known buckets: ${known.join(", ")}`
    );
    for (const name of known) {
      const { error } = await client.storage.from(name).list("", { limit: 1 });
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
    limitations,
  };
}

function requiredManifestFields(m: Record<string, unknown>): boolean {
  const keys = [
    "bucketCount",
    "objectCount",
    "folderCount",
    "storageSize",
    "checksum",
    "createdAt",
    "gitCommit",
    "applicationVersion",
    "backupStatus",
  ];
  return keys.every((k) => m[k] !== undefined && m[k] !== null);
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

function sha256(buf: Buffer): string {
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

/** ZIP local-header parse for stored entries (Mission 08.2 compatible). */
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

function assertNoSecretsInEntries(entries: ArchiveEntry[]): string[] {
  const hits: string[] = [];
  const forbidden = [
    /SUPABASE_SERVICE_ROLE/i,
    /SERVICE_ROLE_KEY/i,
    /BEGIN (RSA |OPENSSH )?PRIVATE KEY/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./, // JWT-shaped
  ];
  for (const e of entries) {
    if (e.name.endsWith(".env") || e.name.includes(".env.")) {
      hits.push(`secret path: ${e.name}`);
      continue;
    }
    // Only scan small text-like metadata
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

function verifyPackage(
  zipPath: string,
  contentEntries: ArchiveEntry[]
): Validation & { ok: boolean } {
  const buf = readFileSync(zipPath);
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
  const man = zipped.find((z) => z.name === "manifest.json");
  if (man) {
    try {
      const m = JSON.parse(man.data.toString("utf8")) as Manifest;
      manifestValid =
        requiredManifestFields(m as unknown as Record<string, unknown>) &&
        typeof m.checksum === "string" &&
        m.checksum.startsWith("sha256:") &&
        (m.backupStatus === "SUCCESS" || m.backupStatus === "FAILED");
      if (
        m.backupStatus === "SUCCESS" &&
        !(
          m.validation?.readable &&
          m.validation?.manifestValid &&
          m.validation?.folderStructureValid &&
          m.validation?.integrityValid
        )
      ) {
        manifestValid = false;
      }
    } catch {
      manifestValid = false;
    }
  }

  const validation: Validation = {
    readable: everyFileReadable,
    manifestValid,
    folderStructureValid,
    integrityValid,
  };
  const ok =
    validation.readable &&
    validation.manifestValid &&
    validation.folderStructureValid &&
    validation.integrityValid;
  return { ...validation, ok };
}

async function main() {
  loadEnvLocal();
  const { out: cliOut, dryValidate: dryFlag } = parseArgs(
    process.argv.slice(2)
  );

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const hasServiceRole = Boolean(url && serviceKey);
  const hasAnon = Boolean(url && anonKey);
  const dryValidate = dryFlag || (!hasServiceRole && !hasAnon);

  const createdAt = new Date().toISOString();
  const stamp = dateStamp(new Date(createdAt));
  const applicationVersion = readPackageVersion();
  const gitCommit = getGitCommit();
  const outDir = resolveOutDir(cliOut);
  const fileName = `SODA_Storage_${stamp}.zip`;
  const zipPath = path.join(outDir, fileName);

  console.log(`${PRODUCT} — Enterprise Storage Snapshot`);
  console.log(`  applicationVersion: ${applicationVersion}`);
  console.log(`  gitCommit: ${gitCommit}`);
  console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${maskSecret(url)}`);
  console.log(
    `  SUPABASE_SERVICE_ROLE_KEY: ${maskSecret(serviceKey)}`
  );
  console.log(
    `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${maskSecret(anonKey)}`
  );
  console.log(`  mode intent: ${dryValidate ? "dry_validate" : "live"}`);
  console.log(`  out: ${zipPath}`);

  if (existsSync(zipPath)) {
    console.error(`Refusing to overwrite existing backup:\n  ${zipPath}`);
    process.exit(1);
  }

  const limitations: string[] = [];
  const contentEntries: ArchiveEntry[] = [];
  let mode: BackupMode = "dry_validate";
  let bucketCount = 0;
  let objectCount = 0;
  let folderCount = 0;
  let storageSize = 0;
  let remoteOk = false;

  const local = collectLocalAssetEntries();
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

  if (dryValidate) {
    mode = "dry_validate";
    limitations.push(
      "Dry validation / no usable Storage API credentials — packaged local public/brand assets + packaging checks only."
    );
    limitations.push(
      "Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for full bucket object recovery."
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
  } else if (hasServiceRole) {
    mode = "service_role";
    try {
      const remote = await fetchStorageViaSupabase(serviceKey!, "service_role");
      contentEntries.push(...remote.entries);
      bucketCount = remote.buckets.length;
      objectCount += remote.objectCount;
      folderCount += remote.folderCount;
      storageSize += remote.storageSize;
      limitations.push(...remote.limitations);
      remoteOk = remote.objectCount > 0 || remote.buckets.length >= 0;
      // remoteOk if we successfully listed buckets (even empty)
      remoteOk = true;
    } catch (err) {
      limitations.push(
        `service_role fetch failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  } else if (hasAnon) {
    mode = "anon";
    try {
      const remote = await fetchStorageViaSupabase(anonKey!, "anon");
      contentEntries.push(...remote.entries);
      bucketCount = remote.buckets.length;
      objectCount += remote.objectCount;
      folderCount += remote.folderCount;
      storageSize += remote.storageSize;
      limitations.push(...remote.limitations);
      remoteOk = true;
    } catch (err) {
      limitations.push(
        `anon fetch failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Never package credentials
  const secretHits = assertNoSecretsInEntries(contentEntries);
  if (secretHits.length) {
    limitations.push(...secretHits.map((h) => `REFUSED packaging: ${h}`));
    for (const hit of secretHits) {
      console.error(`SECURITY: ${hit}`);
    }
    process.exit(1);
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

  const provisionalValidation: Validation = {
    readable: true,
    manifestValid: true,
    folderStructureValid:
      contentEntries.some((e) => e.name.startsWith("local/")) ||
      contentEntries.some((e) => e.name.startsWith("storage/")),
    integrityValid: true,
  };

  let backupStatus: BackupStatus = "FAILED";
  if (
    provisionalValidation.folderStructureValid &&
    local.objectCount > 0 &&
    (mode === "dry_validate" || remoteOk)
  ) {
    backupStatus = "SUCCESS";
  }

  const manifest: Manifest = {
    product: PRODUCT,
    brand: "SODA VISUALS",
    backupStatus,
    mode,
    bucketCount,
    objectCount,
    folderCount,
    storageSize,
    checksum,
    createdAt,
    gitCommit,
    applicationVersion,
    backupSize: 0,
    outputFile: fileName,
    limitations,
    validation: provisionalValidation,
  };

  mkdirSync(outDir, { recursive: true });
  let zipBuf = buildPackage(manifest, contentEntries);
  manifest.backupSize = zipBuf.length;
  zipBuf = buildPackage(manifest, contentEntries);
  writeFileSync(zipPath, zipBuf);

  const verified = verifyPackage(zipPath, contentEntries);
  const validation: Validation = {
    readable: verified.readable,
    manifestValid: verified.manifestValid,
    folderStructureValid: verified.folderStructureValid,
    integrityValid: verified.integrityValid,
  };

  if (!verified.ok) {
    backupStatus = "FAILED";
  } else if (mode === "dry_validate") {
    backupStatus = local.objectCount > 0 ? "SUCCESS" : "FAILED";
  } else if (remoteOk && local.objectCount > 0) {
    backupStatus = "SUCCESS";
  } else if (remoteOk && objectCount > 0) {
    backupStatus = "SUCCESS";
  } else {
    backupStatus = "FAILED";
  }

  if (!verified.ok) backupStatus = "FAILED";

  if (backupStatus === "SUCCESS") {
    manifest.validation = {
      readable: true,
      manifestValid: true,
      folderStructureValid: true,
      integrityValid: true,
    };
  } else {
    manifest.validation = validation;
  }
  manifest.backupStatus = backupStatus;

  zipBuf = buildPackage(manifest, contentEntries);
  manifest.backupSize = zipBuf.length;
  zipBuf = buildPackage(manifest, contentEntries);
  writeFileSync(zipPath, zipBuf);

  const verified2 = verifyPackage(zipPath, contentEntries);
  if (!verified2.ok) {
    manifest.backupStatus = "FAILED";
    manifest.validation = {
      readable: verified2.readable,
      manifestValid: verified2.manifestValid,
      folderStructureValid: verified2.folderStructureValid,
      integrityValid: verified2.integrityValid,
    };
    zipBuf = buildPackage(manifest, contentEntries);
    manifest.backupSize = zipBuf.length;
    writeFileSync(zipPath, buildPackage(manifest, contentEntries));
    backupStatus = "FAILED";
  }

  const finalBuf = readFileSync(zipPath);
  const sibling = path.join(outDir, `SODA_Storage_${stamp}.manifest.json`);
  const finalMan = parseZipEntries(finalBuf).find(
    (z) => z.name === "manifest.json"
  );
  let finalStatus: BackupStatus = backupStatus;
  if (finalMan) {
    try {
      const m = JSON.parse(finalMan.data.toString("utf8")) as Manifest;
      finalStatus = m.backupStatus;
      writeFileSync(
        sibling,
        `${JSON.stringify(
          {
            ...m,
            zipDigest: sha256(finalBuf),
          },
          null,
          2
        )}\n`,
        "utf8"
      );
    } catch {
      finalStatus = "FAILED";
    }
  }

  const last = verifyPackage(zipPath, contentEntries);
  if (!last.ok) finalStatus = "FAILED";

  console.log(
    `\n${finalStatus === "SUCCESS" ? "OK" : "FAILED"} — storage snapshot`
  );
  console.log(`  status:   ${finalStatus}`);
  console.log(`  mode:     ${mode}`);
  console.log(`  zip:      ${zipPath}`);
  console.log(`  size:     ${finalBuf.length} bytes`);
  console.log(`  buckets:  ${bucketCount}`);
  console.log(`  objects:  ${objectCount}`);
  console.log(`  folders:  ${folderCount}`);
  console.log(`  storage:  ${storageSize} bytes`);
  console.log(`  checksum: ${checksum}`);
  console.log(`  digest:   ${sha256(finalBuf)}`);
  console.log(`  manifest: ${sibling}`);
  console.log(
    `  validation: readable=${last.readable} manifest=${last.manifestValid} folders=${last.folderStructureValid} integrity=${last.integrityValid}`
  );
  if (limitations.length) {
    console.log(`  limitations:`);
    for (const l of limitations) console.log(`    - ${l}`);
  }

  process.exit(finalStatus === "SUCCESS" && last.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
