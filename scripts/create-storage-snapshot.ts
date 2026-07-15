/**
 * Mission 08.3 / 08.3.1 — Enterprise Storage Protection (Founder)
 *
 * Creates SODA_Storage_<date>.zip with Supabase Storage objects (when credentials
 * allow), local public/brand assets, metadata, and manifest.json.
 * Never writes secrets / API keys into the package.
 *
 * Run: npm run backup:storage
 * Live Production (service_role required): npm run backup:storage -- --require-service-role
 * Docs: docs/SODA_MASTER/SOURCE_PROTECTION.md
 *
 * Future (stubs only): IncrementalStorageBackup, CloudReplication, MultiBucketBackup
 * — see lib/backup/storage-protection-stubs.ts
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  buildStorageSnapshot,
  projectRefFromUrl,
  sha256,
} from "../lib/backup/storage-snapshot-core";
import { loadEnvLocal, maskSecret } from "./load-env-local";

const PRODUCT = "SODA OS";
const REPO_ROOT = process.cwd();

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

function parseArgs(argv: string[]): {
  out?: string;
  dryValidate: boolean;
  requireServiceRole: boolean;
} {
  let out: string | undefined;
  let dryValidate = false;
  let requireServiceRole = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) {
      out = argv[++i];
    } else if (argv[i] === "--dry-validate") {
      dryValidate = true;
    } else if (
      argv[i] === "--require-service-role" ||
      argv[i] === "--live"
    ) {
      requireServiceRole = true;
    }
  }
  return { out, dryValidate, requireServiceRole };
}

async function main() {
  loadEnvLocal();
  const {
    out: cliOut,
    dryValidate: dryFlag,
    requireServiceRole,
  } = parseArgs(process.argv.slice(2));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const outDir = resolveOutDir(cliOut);

  console.log(`${PRODUCT} — Enterprise Storage Snapshot`);
  console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${maskSecret(url)}`);
  console.log(`  projectReference: ${projectRefFromUrl(url)}`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${maskSecret(serviceKey)}`);
  console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${maskSecret(anonKey)}`);
  console.log(
    `  requireServiceRole: ${requireServiceRole || Boolean(serviceKey)}`
  );
  console.log(`  outDir: ${outDir}`);

  if (requireServiceRole && !serviceKey) {
    console.error(
      "FAILED — SUPABASE_SERVICE_ROLE_KEY required (--require-service-role / --live)."
    );
    process.exit(1);
  }

  const result = await buildStorageSnapshot({
    repoRoot: REPO_ROOT,
    dryValidate: dryFlag,
    requireServiceRole: requireServiceRole || Boolean(serviceKey),
  });

  const zipPath = path.join(outDir, result.fileName);
  if (existsSync(zipPath)) {
    const incomplete = zipPath.replace(
      /\.zip$/i,
      `.incomplete-${Date.now()}.zip`
    );
    renameSync(zipPath, incomplete);
    console.log(`  moved prior zip aside: ${incomplete}`);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(zipPath, result.zipBuffer);

  const onDisk = readFileSync(zipPath);
  const onDiskReadable =
    onDisk.length >= 22 && onDisk.readUInt32LE(0) === 0x04034b50;

  const sibling = path.join(
    outDir,
    result.fileName.replace(/\.zip$/i, ".manifest.json")
  );
  writeFileSync(
    sibling,
    `${JSON.stringify(
      {
        ...result.manifest,
        zipDigest: sha256(onDisk),
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const m = result.manifest;
  const finalStatus = m.backupStatus;
  const validationOk =
    finalStatus === "SUCCESS" &&
    m.mode === "service_role" &&
    m.validation.bucketEnumerationOk &&
    m.failedObjectCount === 0 &&
    onDiskReadable &&
    Boolean(m.checksum);

  console.log(
    `\n${validationOk ? "OK" : "FAILED"} — storage snapshot`
  );
  console.log(`  status:   ${finalStatus}`);
  console.log(`  mode:     ${m.mode}`);
  console.log(`  project:  ${m.projectReference}`);
  console.log(`  zip:      ${zipPath}`);
  console.log(`  size:     ${onDisk.length} bytes`);
  console.log(`  buckets:  ${m.bucketCount}`);
  console.log(`  objects:  ${m.objectCount}`);
  console.log(`  folders:  ${m.folderCount}`);
  console.log(`  failed:   ${m.failedObjectCount}`);
  console.log(`  storage:  ${m.storageSize} bytes`);
  console.log(`  checksum: ${m.checksum}`);
  console.log(`  digest:   ${sha256(onDisk)}`);
  console.log(`  manifest: ${sibling}`);
  console.log(
    `  validation: mode=${m.mode} enum=${m.validation.bucketEnumerationOk} failedObjs=${m.failedObjectCount} readable=${onDiskReadable}`
  );
  if (m.limitations.length) {
    console.log(`  limitations:`);
    for (const l of m.limitations) console.log(`    - ${l}`);
  }

  process.exit(validationOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
