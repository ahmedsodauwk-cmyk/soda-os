/**
 * Mission 08.2 — Enterprise Database Protection (Founder)
 *
 * Creates SODA_Database_<date>.zip with schema/data (when credentials allow),
 * migrations, and manifest.json. Never writes secrets into the package.
 *
 * Run: npm run backup:database
 * Docs: docs/SODA_MASTER/SOURCE_PROTECTION.md
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { buildZipBuffer } from "../lib/backup/zip";
import { loadEnvLocal, maskSecret } from "./load-env-local";

const PRODUCT = "SODA OS";
const REPO_ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(REPO_ROOT, "supabase", "migrations");

type BackupMode = "pg_dump" | "pg_client" | "service_role" | "dry_validate";
type BackupStatus = "SUCCESS" | "FAILED";

type Counts = {
  tableCount: number;
  functionCount: number;
  policyCount: number;
  triggerCount: number;
  viewCount: number;
};

type Validation = {
  readable: boolean;
  manifestValid: boolean;
  sqlValid: boolean;
  integrityValid: boolean;
};

type Manifest = {
  product: string;
  brand: string;
  backupStatus: BackupStatus;
  mode: BackupMode;
  databaseVersion: string;
  migrationCount: number;
  tableCount: number;
  functionCount: number;
  policyCount: number;
  triggerCount: number;
  viewCount: number;
  backupSize: number;
  checksum: string;
  createdAt: string;
  gitCommit: string;
  applicationVersion: string;
  outputFile: string;
  limitations: string[];
  appliedMigrations: string[];
  validation: Validation;
};

type ArchiveEntry = { name: string; data: Buffer };

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

function projectRefFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname;
    const ref = host.split(".")[0];
    return ref || undefined;
  } catch {
    return undefined;
  }
}

/** Resolve Postgres URL without logging the value. */
function resolveDatabaseUrl(): string | null {
  const direct =
    process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DIRECT_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    null;
  if (direct) return direct;

  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    process.env.POSTGRES_PASSWORD?.trim();
  const ref = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (password && ref) {
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }
  return null;
}

function resolveOutDir(cliOut?: string): string {
  if (cliOut?.trim()) return path.resolve(cliOut.trim());
  const envOut = process.env.SODA_DATABASE_SNAPSHOT_OUT?.trim();
  if (envOut) return path.resolve(envOut);

  const founderDb = "D:\\SODA OS\\Database";
  if (existsSync(founderDb)) return founderDb;

  const founderExportsDb = "D:\\SODA OS\\Exports\\Database";
  if (existsSync("D:\\SODA OS\\Exports")) {
    mkdirSync(founderExportsDb, { recursive: true });
    return founderExportsDb;
  }

  const fallback = path.join(REPO_ROOT, "Exports", "Database");
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

function listMigrationFiles(): string[] {
  if (!existsSync(MIGRATIONS_DIR)) return [];
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

function collectMigrationEntries(): {
  files: string[];
  entries: ArchiveEntry[];
} {
  const files = listMigrationFiles();
  const entries: ArchiveEntry[] = [];
  for (const name of files) {
    entries.push({
      name: `migrations/${name}`,
      data: readFileSync(path.join(MIGRATIONS_DIR, name)),
    });
  }
  entries.push({
    name: "migrations/applied_migrations.json",
    data: Buffer.from(
      `${JSON.stringify(
        {
          note: "Filenames from supabase/migrations/. Live schema_migrations rows included only when DB credentials allow.",
          count: files.length,
          files,
        },
        null,
        2
      )}\n`,
      "utf8"
    ),
  });
  return { files, entries };
}

const KNOWN_PG_DUMP_PATHS = [
  "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe",
];

/** Resolve pg_dump binary: PATH first, then known PostgreSQL install paths. */
function resolvePgDumpBinary(): string | null {
  const fromPath = spawnSync("pg_dump", ["--version"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (fromPath.status === 0) return "pg_dump";

  for (const candidate of KNOWN_PG_DUMP_PATHS) {
    if (!existsSync(candidate)) continue;
    const r = spawnSync(candidate, ["--version"], {
      encoding: "utf8",
      windowsHide: true,
    });
    if (r.status === 0) return candidate;
  }
  return null;
}

/** Prefer a unique ZIP name — never silently overwrite an earlier same-date archive. */
function resolveZipPath(outDir: string, stamp: string): {
  fileName: string;
  zipPath: string;
} {
  const base = `SODA_Database_${stamp}.zip`;
  const basePath = path.join(outDir, base);
  if (!existsSync(basePath)) {
    return { fileName: base, zipPath: basePath };
  }
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const stamped = `SODA_Database_${stamp}_${hh}${mm}${ss}.zip`;
  const stampedPath = path.join(outDir, stamped);
  if (!existsSync(stampedPath)) {
    console.log(
      `  note: ${base} exists — writing ${stamped} instead (no overwrite)`
    );
    return { fileName: stamped, zipPath: stampedPath };
  }
  const uniq = `SODA_Database_${stamp}_${hh}${mm}${ss}_${Date.now()}.zip`;
  console.log(
    `  note: prior archives exist — writing ${uniq} instead (no overwrite)`
  );
  return { fileName: uniq, zipPath: path.join(outDir, uniq) };
}

function countSqlObjects(sql: string): Counts {
  const re = (pattern: RegExp) => (sql.match(pattern) || []).length;
  return {
    tableCount: re(/CREATE TABLE\s+/gi),
    functionCount: re(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+/gi),
    policyCount: re(/CREATE\s+POLICY\s+/gi),
    triggerCount: re(/CREATE\s+TRIGGER\s+/gi),
    viewCount: re(/CREATE\s+(OR\s+REPLACE\s+)?VIEW\s+/gi),
  };
}

async function dumpWithPgDump(
  connectionString: string
): Promise<{ sql: Buffer; counts: Counts; databaseVersion: string } | null> {
  const pgDumpBin = resolvePgDumpBinary();
  if (!pgDumpBin) return null;

  // Ensure known PostgreSQL 18 bin is on PATH for any nested tooling
  const pg18Bin = "C:\\Program Files\\PostgreSQL\\18\\bin";
  if (existsSync(pg18Bin)) {
    const sep = path.delimiter;
    const parts = (process.env.PATH || "").split(sep);
    if (!parts.some((p) => p.toLowerCase() === pg18Bin.toLowerCase())) {
      process.env.PATH = `${pg18Bin}${sep}${process.env.PATH || ""}`;
    }
  }

  const r = spawnSync(
    pgDumpBin,
    [
      "--no-owner",
      "--no-acl",
      "--clean",
      "--if-exists",
      "--format=plain",
      connectionString,
    ],
    {
      encoding: "buffer",
      windowsHide: true,
      maxBuffer: 512 * 1024 * 1024,
      env: process.env,
    }
  );

  if (r.status !== 0) {
    const err = (r.stderr?.toString("utf8") || "")
      .replace(connectionString, "[redacted]")
      .slice(0, 500);
    console.error(`pg_dump failed: ${err || `exit ${r.status}`}`);
    return null;
  }

  const sql = Buffer.isBuffer(r.stdout)
    ? r.stdout
    : Buffer.from(String(r.stdout ?? ""), "utf8");
  const text = sql.toString("utf8");
  return {
    sql,
    counts: countSqlObjects(text),
    databaseVersion:
      text.match(/Dumped from database version ([^\n\r]+)/)?.[1]?.trim() ||
      "unknown (pg_dump)",
  };
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) {
    return `'${value.toISOString().replace(/'/g, "''")}'`;
  }
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function dumpWithPgClient(connectionString: string): Promise<{
  entries: ArchiveEntry[];
  counts: Counts;
  databaseVersion: string;
} | null> {
  try {
    const { default: pg } = await import("pg");
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    try {
      const ver = await client.query("select version() as v");
      const databaseVersion = String(ver.rows[0]?.v ?? "unknown");

      const tablesRes = await client.query<{
        schemaname: string;
        tablename: string;
      }>(`
        select schemaname, tablename
        from pg_catalog.pg_tables
        where schemaname not in ('pg_catalog', 'information_schema')
        order by schemaname, tablename
      `);

      const viewsRes = await client.query<{ count: string }>(`
        select count(*)::text as count from pg_catalog.pg_views
        where schemaname not in ('pg_catalog', 'information_schema')
      `);
      const funcsRes = await client.query<{ count: string }>(`
        select count(*)::text as count
        from pg_catalog.pg_proc p
        join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where n.nspname not in ('pg_catalog', 'information_schema')
          and p.prokind = 'f'
      `);
      const policiesRes = await client.query<{ count: string }>(`
        select count(*)::text as count from pg_catalog.pg_policies
      `);
      const triggersRes = await client.query<{ count: string }>(`
        select count(*)::text as count
        from pg_catalog.pg_trigger t
        join pg_catalog.pg_class c on c.oid = t.tgrelid
        join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where not t.tgisinternal
          and n.nspname not in ('pg_catalog', 'information_schema')
      `);

      const schemaParts: string[] = [
        `-- SODA OS database snapshot (pg client)`,
        `-- Credentials are never written into this file`,
        `-- Server: ${databaseVersion.replace(/\n/g, " ")}`,
        "",
      ];

      const ext = await client.query<{ extname: string; extversion: string }>(`
        select extname, extversion from pg_extension order by extname
      `);
      for (const row of ext.rows) {
        schemaParts.push(
          `CREATE EXTENSION IF NOT EXISTS ${quoteIdent(row.extname)}; -- ${row.extversion}`
        );
      }
      schemaParts.push("");

      for (const t of tablesRes.rows) {
        const cols = await client.query<{
          column_name: string;
          data_type: string;
          udt_name: string;
          is_nullable: string;
          column_default: string | null;
        }>(
          `
          select column_name, data_type, udt_name, is_nullable, column_default
          from information_schema.columns
          where table_schema = $1 and table_name = $2
          order by ordinal_position
        `,
          [t.schemaname, t.tablename]
        );
        const colDefs = cols.rows.map((c) => {
          const typ =
            c.data_type === "USER-DEFINED" ? c.udt_name : c.data_type;
          const nullSql = c.is_nullable === "YES" ? "" : " NOT NULL";
          const def = c.column_default
            ? ` DEFAULT ${c.column_default}`
            : "";
          return `  ${quoteIdent(c.column_name)} ${typ}${nullSql}${def}`;
        });
        schemaParts.push(
          `CREATE TABLE IF NOT EXISTS ${quoteIdent(t.schemaname)}.${quoteIdent(t.tablename)} (`
        );
        schemaParts.push(colDefs.join(",\n"));
        schemaParts.push(`);`);
        schemaParts.push("");
      }

      const funcs = await client.query<{ def: string | null }>(`
        select pg_get_functiondef(p.oid) as def
        from pg_catalog.pg_proc p
        join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prokind = 'f'
        order by p.proname
      `);
      for (const f of funcs.rows) {
        if (f.def) {
          schemaParts.push(`${f.def};`);
          schemaParts.push("");
        }
      }

      const policies = await client.query<{
        schemaname: string;
        tablename: string;
        policyname: string;
        permissive: string;
        roles: string[];
        cmd: string;
        qual: string | null;
        with_check: string | null;
      }>(`
        select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        from pg_catalog.pg_policies
        order by schemaname, tablename, policyname
      `);
      for (const p of policies.rows) {
        schemaParts.push(
          `CREATE POLICY ${quoteIdent(p.policyname)} ON ${quoteIdent(p.schemaname)}.${quoteIdent(p.tablename)}`
        );
        schemaParts.push(
          `  AS ${p.permissive} FOR ${p.cmd} TO ${p.roles.map(quoteIdent).join(", ")}`
        );
        if (p.qual) schemaParts.push(`  USING (${p.qual})`);
        if (p.with_check) schemaParts.push(`  WITH CHECK (${p.with_check})`);
        schemaParts.push(`;`);
        schemaParts.push("");
      }

      const triggers = await client.query<{ def: string | null }>(`
        select pg_get_triggerdef(t.oid, true) as def
        from pg_catalog.pg_trigger t
        join pg_catalog.pg_class c on c.oid = t.tgrelid
        join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where not t.tgisinternal and n.nspname = 'public'
        order by t.tgname
      `);
      for (const tr of triggers.rows) {
        if (tr.def) {
          schemaParts.push(`${tr.def};`);
          schemaParts.push("");
        }
      }

      const indexes = await client.query<{ indexdef: string }>(`
        select indexdef from pg_catalog.pg_indexes
        where schemaname = 'public'
        order by tablename, indexname
      `);
      for (const ix of indexes.rows) {
        schemaParts.push(`${ix.indexdef};`);
      }

      const dataParts: string[] = [
        `-- SODA OS row data snapshot`,
        `SET session_replication_role = replica;`,
        "",
      ];
      for (const t of tablesRes.rows) {
        if (t.schemaname !== "public") continue;
        const fq = `${quoteIdent(t.schemaname)}.${quoteIdent(t.tablename)}`;
        const rows = await client.query(`select * from ${fq}`);
        if (!rows.rows.length) continue;
        const cols = rows.fields.map((f) => quoteIdent(f.name));
        dataParts.push(
          `-- ${t.schemaname}.${t.tablename} (${rows.rows.length} rows)`
        );
        for (const row of rows.rows) {
          const vals = rows.fields.map((f) =>
            sqlLiteral((row as Record<string, unknown>)[f.name])
          );
          dataParts.push(
            `INSERT INTO ${fq} (${cols.join(", ")}) VALUES (${vals.join(", ")});`
          );
        }
        dataParts.push("");
      }
      dataParts.push(`SET session_replication_role = DEFAULT;`);

      const counts: Counts = {
        tableCount: tablesRes.rows.length,
        functionCount: Number(funcsRes.rows[0]?.count ?? 0),
        policyCount: Number(policiesRes.rows[0]?.count ?? 0),
        triggerCount: Number(triggersRes.rows[0]?.count ?? 0),
        viewCount: Number(viewsRes.rows[0]?.count ?? 0),
      };

      return {
        databaseVersion,
        counts,
        entries: [
          {
            name: "dump/schema.sql",
            data: Buffer.from(`${schemaParts.join("\n")}\n`, "utf8"),
          },
          {
            name: "dump/data.sql",
            data: Buffer.from(`${dataParts.join("\n")}\n`, "utf8"),
          },
          {
            name: "dump/README.txt",
            data: Buffer.from(
              "pg_client mode: schema + data via SQL introspection. Prefer pg_dump when available.\n",
              "utf8"
            ),
          },
        ],
      };
    } finally {
      await client.end();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `pg client dump failed: ${msg.replace(/postgresql:\/\/[^\s]+/gi, "[redacted]")}`
    );
    return null;
  }
}

async function dumpWithServiceRole(): Promise<{
  entries: ArchiveEntry[];
  counts: Counts;
  databaseVersion: string;
  limitations: string[];
} | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const limitations: string[] = [
    "Direct Postgres URL unavailable - using service-role REST introspection.",
    "RLS policies, triggers, functions, indexes, and extensions are NOT fully recoverable via PostgREST alone.",
    "Service role key was used in-memory only and is NOT written into this package.",
  ];

  let tableNames: string[] = [];
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/openapi+json",
      },
    });
    if (res.ok) {
      const openapi = (await res.json()) as {
        definitions?: Record<string, unknown>;
        paths?: Record<string, unknown>;
      };
      if (openapi.definitions) {
        tableNames = Object.keys(openapi.definitions).sort();
      } else if (openapi.paths) {
        tableNames = [
          ...new Set(
            Object.keys(openapi.paths)
              .map((p) => p.replace(/^\//, "").split("?")[0]!)
              .filter((n) => n && !n.includes("{"))
          ),
        ].sort();
      }
    }
  } catch {
    limitations.push("OpenAPI schema fetch failed - table list may be incomplete.");
  }

  if (!tableNames.length) {
    tableNames = [
      "profiles",
      "clients",
      "orders",
      "projects",
      "files",
      "people",
      "crew_members",
      "workspaces",
      "equipment",
      "quotations",
      "payments",
      "invoices",
      "deliveries",
      "financial_events",
      "business_events",
      "audit_log",
      "_connection_tests",
    ];
    limitations.push("Used known-table fallback list (OpenAPI empty).");
  }

  const entries: ArchiveEntry[] = [];
  const dumped: string[] = [];
  for (const name of tableNames) {
    try {
      const { data, error } = await admin.from(name).select("*");
      if (error) {
        entries.push({
          name: `service_role/tables/${name}.error.json`,
          data: Buffer.from(
            `${JSON.stringify({ table: name, error: error.message }, null, 2)}\n`,
            "utf8"
          ),
        });
        continue;
      }
      dumped.push(name);
      entries.push({
        name: `service_role/tables/${name}.json`,
        data: Buffer.from(`${JSON.stringify(data ?? [], null, 2)}\n`, "utf8"),
      });
    } catch (err) {
      entries.push({
        name: `service_role/tables/${name}.error.json`,
        data: Buffer.from(
          `${JSON.stringify(
            {
              table: name,
              error: err instanceof Error ? err.message : String(err),
            },
            null,
            2
          )}\n`,
          "utf8"
        ),
      });
    }
  }

  entries.push({
    name: "service_role/README.txt",
    data: Buffer.from(
      [
        "Service-role fallback dump",
        "- Table row JSON only (where readable).",
        "- No service role key or DATABASE_URL stored here.",
        `- Tables dumped: ${dumped.length}`,
        ...limitations.map((l) => `- ${l}`),
        "",
      ].join("\n"),
      "utf8"
    ),
  });

  return {
    entries,
    counts: {
      tableCount: dumped.length,
      functionCount: 0,
      policyCount: 0,
      triggerCount: 0,
      viewCount: 0,
    },
    databaseVersion: "unknown (service_role REST - no pg version)",
    limitations,
  };
}

function validateSqlBuffers(entries: ArchiveEntry[]): boolean {
  const sqlEntries = entries.filter((e) => e.name.endsWith(".sql"));
  if (!sqlEntries.length) return false;
  for (const e of sqlEntries) {
    if (e.data.length === 0) return false;
    const nulls = e.data.filter((b) => b === 0).length;
    if (nulls > e.data.length * 0.01 && nulls > 8) return false;
    const text = e.data.toString("utf8");
    const ok =
      /(--|\bCREATE\b|\bALTER\b|\bINSERT\b|\bSELECT\b|\bSET\b|\bCOMMENT\b)/i.test(
        text
      ) || text.trimStart().startsWith("--");
    if (!ok) return false;
  }
  return true;
}

function zipLooksReadable(buf: Buffer): boolean {
  if (buf.length < 22) return false;
  const sig = buf.readUInt32LE(0);
  if (sig !== 0x04034b50 && sig !== 0x06054b50) return false;
  return buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])) >= 0;
}

function parseZipEntries(
  buf: Buffer
): { name: string; data: Buffer }[] {
  const out: { name: string; data: Buffer }[] = [];
  let offset = 0;
  while (offset + 30 <= buf.length) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const compSize = buf.readUInt32LE(offset + 18);
    const name = buf
      .subarray(offset + 30, offset + 30 + nameLen)
      .toString("utf8");
    const dataStart = offset + 30 + nameLen + extraLen;
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
    "databaseVersion",
    "migrationCount",
    "tableCount",
    "functionCount",
    "policyCount",
    "triggerCount",
    "viewCount",
    "backupSize",
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

/**
 * Immediate post-write verification.
 * Returns whether the package may be marked SUCCESS (validation gates only).
 */
function verifyPackage(
  zipPath: string,
  contentEntries: ArchiveEntry[]
): Validation & { ok: boolean; statusFromManifest: BackupStatus | null } {
  const buf = readFileSync(zipPath);
  const readable = zipLooksReadable(buf);
  const zipped = parseZipEntries(buf);
  const names = zipped.map((z) => z.name);
  const integrityValid =
    readable &&
    names.includes("manifest.json") &&
    names.some((n) => n.startsWith("migrations/"));

  const sqlValid = validateSqlBuffers(
    contentEntries.filter((e) => e.name.endsWith(".sql"))
  );

  let manifestValid = false;
  let statusFromManifest: BackupStatus | null = null;
  const man = zipped.find((z) => z.name === "manifest.json");
  if (man) {
    try {
      const m = JSON.parse(man.data.toString("utf8")) as Manifest;
      statusFromManifest = m.backupStatus;
      manifestValid =
        requiredManifestFields(m as unknown as Record<string, unknown>) &&
        typeof m.checksum === "string" &&
        m.checksum.startsWith("sha256:") &&
        (m.backupStatus === "SUCCESS" || m.backupStatus === "FAILED");
      // SUCCESS never allowed when embedded validation flags are false
      if (
        m.backupStatus === "SUCCESS" &&
        !(
          m.validation?.readable &&
          m.validation?.manifestValid &&
          m.validation?.sqlValid &&
          m.validation?.integrityValid
        )
      ) {
        manifestValid = false;
      }
    } catch {
      manifestValid = false;
    }
  }

  const ok = readable && manifestValid && sqlValid && integrityValid;
  return {
    readable,
    manifestValid,
    sqlValid,
    integrityValid,
    ok,
    statusFromManifest,
  };
}

async function main() {
  loadEnvLocal();
  const { out: cliOut, dryValidate: dryFlag } = parseArgs(
    process.argv.slice(2)
  );

  const databaseUrl = resolveDatabaseUrl();
  const hasServiceRole = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  );
  const dryValidate = dryFlag || (!databaseUrl && !hasServiceRole);

  const createdAt = new Date().toISOString();
  const stamp = dateStamp(new Date(createdAt));
  const applicationVersion = readPackageVersion();
  const gitCommit = getGitCommit();
  const outDir = resolveOutDir(cliOut);
  const { fileName, zipPath } = resolveZipPath(outDir, stamp);

  console.log(`${PRODUCT} — Enterprise Database Snapshot`);
  console.log(`  applicationVersion: ${applicationVersion}`);
  console.log(`  gitCommit: ${gitCommit}`);
  console.log(`  DATABASE_URL: ${maskSecret(databaseUrl ?? undefined)}`);
  console.log(
    `  SUPABASE_SERVICE_ROLE_KEY: ${maskSecret(process.env.SUPABASE_SERVICE_ROLE_KEY)}`
  );
  console.log(`  mode intent: ${dryValidate ? "dry_validate" : "live"}`);
  console.log(
    `  pg_dump: ${resolvePgDumpBinary() ?? "not found (will try pg client / fallbacks)"}`
  );
  console.log(`  out: ${zipPath}`);

  const limitations: string[] = [];
  const contentEntries: ArchiveEntry[] = [];
  let mode: BackupMode = "dry_validate";
  let databaseVersion = "unavailable";
  let counts: Counts = {
    tableCount: 0,
    functionCount: 0,
    policyCount: 0,
    triggerCount: 0,
    viewCount: 0,
  };
  let dumpOk = false;

  const migrations = collectMigrationEntries();
  contentEntries.push(...migrations.entries);

  if (dryValidate) {
    mode = "dry_validate";
    limitations.push(
      "Dry validation / no live DB credentials - packaged migration SQL + packaging checks only."
    );
    limitations.push(
      "Set DATABASE_URL (or SUPABASE_DB_URL / SUPABASE_DB_PASSWORD) for pg_dump / pg client full recovery."
    );
    limitations.push(
      "Or set SUPABASE_SERVICE_ROLE_KEY for REST table-data fallback (schema objects limited)."
    );
    contentEntries.push({
      name: "dump/DRY_VALIDATE.txt",
      data: Buffer.from(
        "Dry validate mode - no live database dump was performed.\n",
        "utf8"
      ),
    });
  } else if (databaseUrl) {
    const pgDump = await dumpWithPgDump(databaseUrl);
    if (pgDump) {
      mode = "pg_dump";
      databaseVersion = pgDump.databaseVersion;
      counts = pgDump.counts;
      contentEntries.push({ name: "dump/full.sql", data: pgDump.sql });
      dumpOk = true;
    } else {
      const clientDump = await dumpWithPgClient(databaseUrl);
      if (clientDump) {
        mode = "pg_client";
        databaseVersion = clientDump.databaseVersion;
        counts = clientDump.counts;
        contentEntries.push(...clientDump.entries);
        dumpOk = true;
        limitations.push(
          "pg_dump binary unavailable or failed - used pg client reconstruction."
        );
      } else if (hasServiceRole) {
        const sr = await dumpWithServiceRole();
        if (sr) {
          mode = "service_role";
          databaseVersion = sr.databaseVersion;
          counts = sr.counts;
          contentEntries.push(...sr.entries);
          limitations.push(...sr.limitations);
          dumpOk = sr.counts.tableCount > 0;
        }
      } else {
        limitations.push(
          "DATABASE_URL present but pg_dump and pg client dump both failed; no service role fallback."
        );
      }
    }
  } else if (hasServiceRole) {
    const sr = await dumpWithServiceRole();
    if (sr) {
      mode = "service_role";
      databaseVersion = sr.databaseVersion;
      counts = sr.counts;
      contentEntries.push(...sr.entries);
      limitations.push(...sr.limitations);
      dumpOk = sr.counts.tableCount > 0;
    }
  }

  if (limitations.length) {
    contentEntries.push({
      name: "LIMITATIONS.md",
      data: Buffer.from(
        `# Database backup limitations\n\n${limitations.map((l) => `- ${l}`).join("\n")}\n`,
        "utf8"
      ),
    });
  }

  const checksum = payloadChecksum(contentEntries);

  // Provisional validation predicted for sealed package
  const provisionalValidation: Validation = {
    readable: true,
    manifestValid: true,
    sqlValid: validateSqlBuffers(
      contentEntries.filter((e) => e.name.endsWith(".sql"))
    ),
    integrityValid: true,
  };

  // Status rules:
  // - dry_validate SUCCESS only if validation passes (packaging)
  // - live SUCCESS only if dumpOk AND validation passes
  // - Never SUCCESS if any validation flag is false
  let backupStatus: BackupStatus = "FAILED";
  if (
    provisionalValidation.sqlValid &&
    migrations.files.length > 0 &&
    (mode === "dry_validate" || dumpOk)
  ) {
    backupStatus = "SUCCESS";
  }

  if (!provisionalValidation.sqlValid) {
    backupStatus = "FAILED";
  }

  const manifest: Manifest = {
    product: PRODUCT,
    brand: "SODA VISUALS",
    backupStatus,
    mode,
    databaseVersion,
    migrationCount: migrations.files.length,
    tableCount: counts.tableCount,
    functionCount: counts.functionCount,
    policyCount: counts.policyCount,
    triggerCount: counts.triggerCount,
    viewCount: counts.viewCount,
    backupSize: 0,
    checksum,
    createdAt,
    gitCommit,
    applicationVersion,
    outputFile: fileName,
    limitations,
    appliedMigrations: migrations.files,
    validation: provisionalValidation,
  };

  mkdirSync(outDir, { recursive: true });
  let zipBuf = buildPackage(manifest, contentEntries);
  manifest.backupSize = zipBuf.length;
  zipBuf = buildPackage(manifest, contentEntries);
  manifest.backupSize = zipBuf.length;
  writeFileSync(zipPath, zipBuf);

  // Immediate verification — downgrade to FAILED if any check fails
  const verified = verifyPackage(zipPath, contentEntries);
  const validation: Validation = {
    readable: verified.readable,
    manifestValid: verified.manifestValid,
    sqlValid: verified.sqlValid,
    integrityValid: verified.integrityValid,
  };

  if (!verified.ok) {
    backupStatus = "FAILED";
  } else if (mode === "dry_validate") {
    backupStatus = "SUCCESS";
  } else if (dumpOk) {
    backupStatus = "SUCCESS";
  } else {
    backupStatus = "FAILED";
  }

  // Never mark SUCCESS when validation failed
  if (!verified.ok) backupStatus = "FAILED";

  manifest.backupStatus = backupStatus;
  manifest.validation = {
    ...validation,
    // Reflect final truth in packaged manifest
    manifestValid: verified.ok
      ? true
      : validation.manifestValid,
  };

  // If we claim SUCCESS, force validation flags true only when verified.ok
  if (backupStatus === "SUCCESS") {
    manifest.validation = {
      readable: true,
      manifestValid: true,
      sqlValid: true,
      integrityValid: true,
    };
  } else {
    manifest.validation = validation;
  }

  zipBuf = buildPackage(manifest, contentEntries);
  manifest.backupSize = zipBuf.length;
  zipBuf = buildPackage(manifest, contentEntries);
  writeFileSync(zipPath, zipBuf);

  // Re-verify after rewrite; force FAILED if still bad
  const verified2 = verifyPackage(zipPath, contentEntries);
  if (!verified2.ok || backupStatus === "SUCCESS") {
    if (!verified2.ok) {
      manifest.backupStatus = "FAILED";
      manifest.validation = {
        readable: verified2.readable,
        manifestValid: verified2.manifestValid,
        sqlValid: verified2.sqlValid,
        integrityValid: verified2.integrityValid,
      };
      zipBuf = buildPackage(manifest, contentEntries);
      manifest.backupSize = zipBuf.length;
      writeFileSync(zipPath, buildPackage(manifest, contentEntries));
      backupStatus = "FAILED";
    }
  }

  const finalBuf = readFileSync(zipPath);
  const sibling = path.join(
    outDir,
    `${fileName.replace(/\.zip$/i, "")}.manifest.json`
  );
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
    `\n${finalStatus === "SUCCESS" ? "OK" : "FAILED"} — database snapshot`
  );
  console.log(`  status:   ${finalStatus}`);
  console.log(`  mode:     ${mode}`);
  console.log(`  zip:      ${zipPath}`);
  console.log(`  size:     ${finalBuf.length} bytes`);
  console.log(`  checksum: ${checksum}`);
  console.log(`  digest:   ${sha256(finalBuf)}`);
  console.log(`  manifest: ${sibling}`);
  console.log(`  migrations: ${migrations.files.length}`);
  console.log(
    `  validation: readable=${last.readable} manifest=${last.manifestValid} sql=${last.sqlValid} integrity=${last.integrityValid}`
  );
  if (limitations.length) {
    console.log(`  limitations:`);
    for (const l of limitations) console.log(`    - ${l}`);
  }

  // dry_validate SUCCESS → exit 0; live SUCCESS → exit 0; else exit 1
  process.exit(finalStatus === "SUCCESS" && last.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
