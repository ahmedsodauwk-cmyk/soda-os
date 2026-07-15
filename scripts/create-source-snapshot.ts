/**
 * Mission 08.1 — Create Source Snapshot (Founder)
 *
 * Collects complete project source into SODA_Source_<version>_<date>.zip
 * with manifest + version metadata. Never includes .env* / secrets.
 *
 * Run: npm run backup:source
 * Docs: docs/SODA_MASTER/SOURCE_PROTECTION.md
 */

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { crc32 } from "node:zlib";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { finished } from "node:stream/promises";

const PRODUCT = "SODA OS";
const REPO_ROOT = process.cwd();

/** Directory names skipped entirely (any depth). */
const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  "out",
  "build",
  "coverage",
  ".vercel",
  ".turbo",
  ".cache",
  "cache",
  "tmp",
  "temp",
  ".timeline-shots",
  ".workspace-shots",
  ".notification-ux-shots",
  "Exports",
  "Versions",
]);

/** Exact relative path prefixes (posix) to skip. */
const SKIP_PREFIXES = ["data/backups/"];

function isEnvSecretName(name: string): boolean {
  if (name === ".env" || name.startsWith(".env.")) return true;
  if (name === ".env.local" || name === ".env.production") return true;
  return /^\.env/.test(name);
}

function shouldSkipFile(relPosix: string, baseName: string): boolean {
  if (isEnvSecretName(baseName)) return true;
  if (baseName.endsWith(".pem")) return true;
  if (baseName === ".DS_Store" || baseName === "Thumbs.db") return true;
  if (baseName.endsWith(".tsbuildinfo")) return true;
  if (baseName.endsWith(".log")) return true;
  if (/^SODA_Source_.*\.zip$/i.test(baseName)) return true;
  for (const prefix of SKIP_PREFIXES) {
    if (relPosix === prefix.slice(0, -1) || relPosix.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

function shouldSkipDir(dirName: string, relPosix: string): boolean {
  if (SKIP_DIR_NAMES.has(dirName)) return true;
  for (const prefix of SKIP_PREFIXES) {
    if (relPosix === prefix.slice(0, -1) || relPosix.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

type FileEntry = { abs: string; relPosix: string; size: number };

function collectFiles(root: string): FileEntry[] {
  const out: FileEntry[] = [];

  function walk(absDir: string, relDir: string) {
    let names: string[];
    try {
      names = readdirSync(absDir);
    } catch {
      return;
    }
    for (const name of names) {
      const abs = path.join(absDir, name);
      const rel = relDir ? `${relDir}/${name}` : name;
      const relPosix = rel.replace(/\\/g, "/");
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (shouldSkipDir(name, relPosix)) continue;
        walk(abs, relPosix);
        continue;
      }
      if (!st.isFile()) continue;
      if (shouldSkipFile(relPosix, name)) continue;
      out.push({ abs, relPosix, size: st.size });
    }
  }

  walk(root, "");
  out.sort((a, b) => a.relPosix.localeCompare(b.relPosix));
  return out;
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

function getGitBranch(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
    process.env.GIT_BRANCH?.trim() ||
    git(["rev-parse", "--abbrev-ref", "HEAD"]) ||
    "unknown"
  );
}

function dateStamp(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function resolveOutDir(cliOut?: string): string {
  if (cliOut?.trim()) return path.resolve(cliOut.trim());
  const envOut = process.env.SODA_SOURCE_SNAPSHOT_OUT?.trim();
  if (envOut) return path.resolve(envOut);

  const founderVersions = "D:\\SODA OS\\Versions";
  const founderExports = "D:\\SODA OS\\Exports";
  if (existsSync(founderVersions)) return founderVersions;
  if (existsSync(founderExports)) return founderExports;

  return path.join(REPO_ROOT, "Exports");
}

function parseArgs(argv: string[]): { out?: string } {
  let out: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) {
      out = argv[++i];
    }
  }
  return { out };
}

/* ---- Minimal streaming ZIP (store / no compression) ---- */

function u16(n: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n, 0);
  return b;
}

function u32(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

function dosDateTime(d = new Date()): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  const time =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    ((Math.floor(d.getSeconds() / 2) & 0x1f) << 0);
  const date =
    (((year - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0xf) << 5) |
    (d.getDate() & 0x1f);
  return { time, date };
}

type ZipCentral = {
  nameBuf: Buffer;
  crc: number;
  size: number;
  offset: number;
  time: number;
  date: number;
};

async function drainWrite(
  ws: ReturnType<typeof createWriteStream>,
  buf: Buffer
): Promise<void> {
  if (!ws.write(buf)) {
    await new Promise<void>((resolve) => ws.once("drain", resolve));
  }
}

async function writeSourceZip(
  zipPath: string,
  files: { archiveName: string; data: Buffer }[],
  diskFiles: FileEntry[]
): Promise<{ totalFiles: number; projectSize: number }> {
  const { time, date } = dosDateTime();
  mkdirSync(path.dirname(zipPath), { recursive: true });
  const ws = createWriteStream(zipPath);
  let offset = 0;
  const centrals: ZipCentral[] = [];
  let payloadBytes = 0;
  let totalFiles = 0;

  async function addBuffer(archiveName: string, data: Buffer) {
    const nameBuf = Buffer.from(archiveName.replace(/\\/g, "/"), "utf8");
    const crc = crc32(data) >>> 0;
    const size = data.length;
    const localOffset = offset;

    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(time),
      u16(date),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBuf.length),
      u16(0),
      nameBuf,
    ]);

    await drainWrite(ws, localHeader);
    offset += localHeader.length;

    if (size > 0) {
      await drainWrite(ws, data);
      offset += size;
    }

    payloadBytes += size;
    totalFiles += 1;
    centrals.push({ nameBuf, crc, size, offset: localOffset, time, date });
  }

  for (const meta of files) {
    await addBuffer(meta.archiveName, meta.data);
  }

  for (const file of diskFiles) {
    const data = readFileSync(file.abs);
    await addBuffer(file.relPosix, data);
  }

  const centralParts: Buffer[] = [];
  for (const c of centrals) {
    centralParts.push(
      Buffer.concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(c.time),
        u16(c.date),
        u32(c.crc),
        u32(c.size),
        u32(c.size),
        u16(c.nameBuf.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(c.offset),
        c.nameBuf,
      ])
    );
  }
  const centralDir = Buffer.concat(centralParts);
  const centralOffset = offset;
  await drainWrite(ws, centralDir);
  offset += centralDir.length;

  const end = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(centrals.length),
    u16(centrals.length),
    u32(centralDir.length),
    u32(centralOffset),
    u16(0),
  ]);
  await drainWrite(ws, end);
  ws.end();
  await finished(ws);

  return { totalFiles, projectSize: payloadBytes };
}

async function main() {
  const { out: cliOut } = parseArgs(process.argv.slice(2));
  const version = readPackageVersion();
  const commit = getGitCommit();
  const branch = getGitBranch();
  const createdAt = new Date().toISOString();
  const stamp = dateStamp(new Date(createdAt));
  const outDir = resolveOutDir(cliOut);
  const fileName = `SODA_Source_${version}_${stamp}.zip`;
  const zipPath = path.join(outDir, fileName);

  if (existsSync(zipPath)) {
    console.error(`Refusing to overwrite existing snapshot:\n  ${zipPath}`);
    process.exit(1);
  }

  console.log(`${PRODUCT} — Create Source Snapshot`);
  console.log(`  version: ${version}`);
  console.log(`  commit:  ${commit}`);
  console.log(`  branch:  ${branch}`);
  console.log(`  out:     ${zipPath}`);

  const diskFiles = collectFiles(REPO_ROOT);
  // Exclude the output path if somehow under root (Exports skipped as dir)
  const filtered = diskFiles.filter(
    (f) => path.resolve(f.abs) !== path.resolve(zipPath)
  );

  const exclusions = {
    skipDirs: [...SKIP_DIR_NAMES].sort(),
    skipPrefixes: SKIP_PREFIXES,
    skipFiles: [".env*", "*.pem", "*.log", "SODA_Source_*.zip", "*.tsbuildinfo"],
  };

  // Precompute content size for disk files, then write zip with placeholder
  // manifest updated after counts — write metadata files second pass style:
  // First pass sizes known from filtered; manifest gets final totals after zip.
  // We compute totals after packaging by including metadata in the zip first
  // with accurate counts: meta files + filtered.length.

  const sourceFileCount = filtered.length;
  const sourceBytes = filtered.reduce((n, f) => n + f.size, 0);

  // Manifest totalFiles includes metadata entries written into the zip.
  const metaNames = [
    "manifest.json",
    "VERSION.txt",
    "GIT_COMMIT.txt",
    "GIT_BRANCH.txt",
    "BUILD_DATE.txt",
  ];
  const totalFiles = sourceFileCount + metaNames.length;
  // projectSize = source bytes + metadata text sizes (approx known once built)

  const manifestBase = {
    product: PRODUCT,
    version,
    commit,
    branch,
    createdAt,
    totalFiles,
    projectSize: 0, // filled below
    outputFile: fileName,
    exclusions,
  };

  const versionTxt = `${version}\n`;
  const commitTxt = `${commit}\n`;
  const branchTxt = `${branch}\n`;
  const buildDateTxt = `${createdAt}\n`;

  const metaSize =
    Buffer.byteLength(versionTxt, "utf8") +
    Buffer.byteLength(commitTxt, "utf8") +
    Buffer.byteLength(branchTxt, "utf8") +
    Buffer.byteLength(buildDateTxt, "utf8");

  // manifest size depends on projectSize field — compute projectSize as
  // sourceBytes + metaSize + manifest json length iteratively.
  let projectSize = sourceBytes + metaSize;
  let manifestJson = "";
  for (let i = 0; i < 3; i++) {
    const manifest = { ...manifestBase, projectSize };
    manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
    projectSize = sourceBytes + metaSize + Buffer.byteLength(manifestJson, "utf8");
  }
  manifestBase.projectSize = projectSize;
  manifestJson = `${JSON.stringify({ ...manifestBase, projectSize }, null, 2)}\n`;

  const metaBuffers = [
    { archiveName: "manifest.json", data: Buffer.from(manifestJson, "utf8") },
    { archiveName: "VERSION.txt", data: Buffer.from(versionTxt, "utf8") },
    { archiveName: "GIT_COMMIT.txt", data: Buffer.from(commitTxt, "utf8") },
    { archiveName: "GIT_BRANCH.txt", data: Buffer.from(branchTxt, "utf8") },
    { archiveName: "BUILD_DATE.txt", data: Buffer.from(buildDateTxt, "utf8") },
  ];

  const result = await writeSourceZip(zipPath, metaBuffers, filtered);

  // Also write a sibling manifest for quick inspection without unzipping
  const siblingManifest = path.join(outDir, `SODA_Source_${version}_${stamp}.manifest.json`);
  writeFileSync(siblingManifest, manifestJson, "utf8");

  console.log(`\nOK — snapshot written`);
  console.log(`  files:   ${result.totalFiles}`);
  console.log(`  size:    ${result.projectSize} bytes (uncompressed payload)`);
  console.log(`  zip:     ${zipPath}`);
  console.log(`  manifest (sibling): ${siblingManifest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
