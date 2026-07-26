/**
 * SR-01 - Disposable PostgreSQL 18 rehearsal (Gates 3-5).
 * Never prints passwords, connection strings, or row contents.
 *
 * Run: npx tsx scripts/sr01-disposable-rehearsal.ts
 */

import assert from "node:assert/strict";
import { spawn, spawnSync, type StdioOptions } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

const REPO = process.cwd();
const PG_BIN = "C:\\Program Files\\PostgreSQL\\18\\bin";
const BACKUP_ZIP =
  "D:\\SODA OS\\Database\\SODA_Database_2026-07-26_195823.zip";
const MIGRATION =
  "supabase/migrations/20260726000028_sr01_core_domain_rls_lockdown.sql";
const ROLLBACK =
  "supabase/rollbacks/20260726000028_sr01_core_domain_rls_lockdown_rollback.sql";
const PREREQ_MIGRATION =
  "supabase/migrations/20260711000004_smart_order_engine_v3.sql";

const BASELINE_ROWS: Record<string, number> = {
  workspaces: 6,
  workspace_subcategories: 9,
  people: 7,
  equipment: 0,
  equipment_assignments: 0,
  projects: 6,
  orders: 6,
  order_assignments: 9,
  quotations: 0,
  payments: 1,
  invoices: 1,
  deliveries: 1,
  financial_events: 13,
  financial_allocations: 5,
  files: 0,
  clients: 5,
  expenses: 0,
  account_transfers: 0,
  period_closings: 0,
  cash_accounts: 5,
  cash_account_movements: 7,
  crew_earnings: 11,
  business_events: 134,
  audit_log: 132,
};

const C1_TABLES = Object.keys(BASELINE_ROWS);
const SR01_HELPERS = [
  "soda_is_domain_founder",
  "soda_is_active_authenticated",
  "soda_profile_access_level",
  "soda_profile_person_id",
  "soda_profile_display_name",
  "soda_order_assigned_to_person",
  "soda_person_shares_order_with",
  "soda_can_access_order",
  "soda_can_access_client",
  "soda_can_access_person",
  "soda_can_access_project",
  "soda_can_access_quotation",
];

const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\..+/, "")
  .replace("T", "-");
const workDir = join(tmpdir(), `sr01-disposable-${stamp}`);
const dataDir = join(workDir, "pgdata");
const pwFile = join(workDir, "pgpass.txt");
const logFile = join(workDir, "postgres.log");
const restoreLog = join(workDir, "restore.log");

let pgPass = "";
let pgStarted = false;
let gate = "init";
let stepNo = 0;
let port = 0;

function step(msg: string): void {
  stepNo += 1;
  console.log(`[SR-01] step ${stepNo}: ${msg}`);
}

function gateLine(name: string, status: string, detail = ""): void {
  const suffix = detail ? ` - ${detail}` : "";
  console.log(`GATE ${name} : ${status}${suffix}`);
}

function pgBin(name: string): string {
  return join(PG_BIN, name);
}

function killChildTree(child: ReturnType<typeof spawn>): void {
  if (!child.pid) return;
  spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
    windowsHide: true,
    shell: false,
  });
}

async function runTimed(
  label: string,
  cmd: string,
  args: string[],
  timeoutSec: number,
  env: Record<string, string> = {},
  logPath?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdio: StdioOptions = logPath
      ? ["ignore", openSync(logPath, "a"), openSync(logPath, "a")]
      : ["ignore", "pipe", "pipe"];

    const child = spawn(cmd, args, {
      env: { ...process.env, ...env },
      windowsHide: true,
      shell: false,
      stdio,
    });

    let stdout = "";
    let stderr = "";
    if (!logPath) {
      child.stdout?.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });
      child.stderr?.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });
    }

    const timer = setTimeout(() => {
      killChildTree(child);
      reject(
        new Error(
          `${label} BLOCKED — timeout after ${timeoutSec}s (category: ${label})`
        )
      );
    }, timeoutSec * 1000);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`${label} failed: ${err.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      const fileTail = logPath && existsSync(logPath)
        ? readFileSync(logPath, "utf8").slice(-4000)
        : "";
      const out = (stderr || stdout || fileTail).trim();
      if (out.match(/password authentication failed|fe_sendauth|no password supplied/i)) {
        reject(
          new Error(
            `${label} BLOCKED — password prompt or auth failure (category: ${label})`
          )
        );
        return;
      }
      if (code !== 0) {
        reject(new Error(`${label} failed: ${out || `exit ${code}`}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function findFreePort(candidates: number[]): Promise<number> {
  for (const candidate of candidates) {
    if (candidate === 5432) continue;
    const free = await new Promise<boolean>((resolve) => {
      const server = createServer();
      server.once("error", () => resolve(false));
      server.listen(candidate, "127.0.0.1", () => {
        server.close(() => resolve(true));
      });
    });
    if (free) return candidate;
  }
  throw new Error("no free disposable port (tried 55432-55439)");
}

function stopCluster(): void {
  if (pgStarted && existsSync(dataDir)) {
    spawnSync(pgBin("pg_ctl.exe"), ["-D", dataDir, "stop", "-m", "fast"], {
      windowsHide: true,
      shell: false,
    });
    pgStarted = false;
  }
}

function cleanup(): void {
  stopCluster();
  try {
    if (existsSync(workDir)) rmSync(workDir, { recursive: true, force: true });
  } catch {
    console.log(`WARN: cleanup incomplete - temp path: ${workDir}`);
  }
  delete process.env.PGPASSWORD;
  delete process.env.DATABASE_URL;
}

function preprocessDump(sql: string): string {
  let out = sql
    .replace(
      /^CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;\r?\n/gm,
      "-- SR-01 rehearsal: supabase_vault skipped (local PG)\n"
    )
    .replace(/^COMMENT ON EXTENSION supabase_vault[^;]+;\r?\n/gm, "");

  out = out.replace(
    /^CREATE SCHEMA vault;\r?\n/gm,
    `CREATE SCHEMA vault;\n` +
      `CREATE TABLE IF NOT EXISTS vault.secrets (\n` +
      `  id uuid,\n` +
      `  name text,\n` +
      `  description text,\n` +
      `  secret text,\n` +
      `  key_id uuid,\n` +
      `  nonce bytea,\n` +
      `  created_at timestamptz,\n` +
      `  updated_at timestamptz\n` +
      `);\n`
  );

  return out;
}

async function expandZip(zipPath: string, dest: string): Promise<void> {
  step("extract backup ZIP to temp");
  await runTimed(
    "Expand-Archive",
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force`,
    ],
    300
  );
}

async function main(): Promise<void> {
  console.log("\nSR-01 Disposable Rehearsal (TS)");
  console.log(`  workDir: ${workDir}`);

  assert.ok(existsSync(pgBin("initdb.exe")), "PostgreSQL 18 tools missing");
  assert.ok(existsSync(BACKUP_ZIP), "backup ZIP missing");
  assert.ok(existsSync(resolve(REPO, MIGRATION)), "SR-01 migration missing");

  port = await findFreePort([
    55432, 55433, 55434, 55435, 55436, 55437, 55438, 55439,
  ]);
  console.log(`  port:    ${port}\n`);

  try {
    gate = "3.1-cluster";
    step("create temp work directory");
    mkdirSync(workDir, { recursive: true });
    pgPass = randomBytes(32).toString("base64url");
    writeFileSync(pwFile, pgPass, "ascii");

    step("initdb disposable cluster (SCRAM, timeout 120s)");
    await runTimed(
      "initdb",
      pgBin("initdb.exe"),
      [
        "-D",
        dataDir,
        "-U",
        "postgres",
        "-A",
        "scram-sha-256",
        `--pwfile=${pwFile}`,
        "--encoding=UTF8",
        "--locale=C",
        "--nosync",
      ],
      120
    );

    writeFileSync(
      join(dataDir, "pg_hba.conf"),
      readFileSync(join(dataDir, "pg_hba.conf"), "utf8") +
        "\nhost all all 127.0.0.1/32 scram-sha-256\n",
      "utf8"
    );

    step(`pg_ctl start on 127.0.0.1:${port} (no-wait, poll isready)`);
    const pgCtlLog = join(workDir, "pg_ctl.log");
    await runTimed(
      "pg_ctl start",
      pgBin("pg_ctl.exe"),
      [
        "-D",
        dataDir,
        "-l",
        logFile,
        "-o",
        `-p ${port} -c listen_addresses=127.0.0.1`,
        "start",
      ],
      30,
      {},
      pgCtlLog
    );
    pgStarted = true;

    step("wait for pg_isready (up to 120s)");
    let ready = false;
    for (let i = 0; i < 120; i++) {
      const r = spawnSync(
        pgBin("pg_isready.exe"),
        ["-h", "127.0.0.1", "-p", String(port), "-U", "postgres"],
        { windowsHide: true, shell: false }
      );
      if (r.status === 0) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!ready) throw new Error(`PostgreSQL not ready on port ${port}`);

    const env = { PGPASSWORD: pgPass };
    gateLine("3.1", "PASS", `disposable cluster on 127.0.0.1:${port}`);

    gate = "3.2-bootstrap";
    const bootstrap = `
CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE authenticated NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
CREATE ROLE supabase_admin NOLOGIN NOINHERIT SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
`;
    const bootstrapPath = join(workDir, "bootstrap.sql");
    writeFileSync(bootstrapPath, bootstrap, "utf8");
    step("psql bootstrap roles (timeout 60s)");
    await runTimed(
      "bootstrap",
      pgBin("psql.exe"),
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-f",
        bootstrapPath,
      ],
      60,
      env
    );
    gateLine("3.2", "PASS", "roles: anon, authenticated, service_role, supabase_admin");

    gate = "3.3-restore";
    const extractDir = join(workDir, "backup");
    mkdirSync(extractDir, { recursive: true });
    await expandZip(BACKUP_ZIP, extractDir);
    const dumpPath = join(extractDir, "dump", "full.sql");
    assert.ok(existsSync(dumpPath), "dump/full.sql missing");

    step("preprocess dump SQL");
    const processed = preprocessDump(readFileSync(dumpPath, "utf8"));
    const processedPath = join(workDir, "full-processed.sql");
    writeFileSync(processedPath, processed, "utf8");

    step("createdb sr01_rehearsal (timeout 60s)");
    await runTimed(
      "createdb",
      pgBin("createdb.exe"),
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "sr01_rehearsal",
      ],
      60,
      env
    );

    step("psql restore dump ON_ERROR_STOP=1 (timeout 900s)");
    await runTimed(
      "psql restore",
      pgBin("psql.exe"),
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "-d",
        "sr01_rehearsal",
        "-v",
        "ON_ERROR_STOP=1",
        "-f",
        processedPath,
      ],
      900,
      env,
      restoreLog
    );
    gateLine("3.3", "PASS", "backup restored to sr01_rehearsal");

    gate = "3.3b-grants";
    step("apply Supabase parity grants for non-C1 tables (profiles)");
    const parityGrants = `
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, service_role;
`;
    const parityPath = join(workDir, "parity-grants.sql");
    writeFileSync(parityPath, parityGrants, "utf8");
    await runTimed(
      "parity grants",
      pgBin("psql.exe"),
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "-d",
        "sr01_rehearsal",
        "-v",
        "ON_ERROR_STOP=1",
        "-f",
        parityPath,
      ],
      30,
      env
    );
    gateLine("3.3b", "PASS", "profiles grants for authenticated (production parity)");

    gate = "3.4-rows";
    step("verify C1 row counts vs Gate 2 baseline");
    const rowFails: string[] = [];
    for (const [table, expected] of Object.entries(BASELINE_ROWS)) {
      const actual = await runTimed(
        `count ${table}`,
        pgBin("psql.exe"),
        [
          "-h",
          "127.0.0.1",
          "-p",
          String(port),
          "-U",
          "postgres",
          "-d",
          "sr01_rehearsal",
          "-t",
          "-A",
          "-c",
          `SELECT count(*)::text FROM public.${table};`,
        ],
        30,
        env
      );
      if (actual !== String(expected)) {
        rowFails.push(`${table} expected=${expected} actual=${actual}`);
      }
    }
    if (rowFails.length > 0) {
      throw new Error(`row count mismatch: ${rowFails.join("; ")}`);
    }
    gateLine("3.4", "PASS", `${C1_TABLES.length} C1 table row counts match Gate 2 baseline`);

    gate = "3.5-policies";
    step("verify pre-migration policy counts");
    const c1List = C1_TABLES.map((t) => `'${t}'`).join(",");
    const policyCount = await runTimed(
      "policy count",
      pgBin("psql.exe"),
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "-d",
        "sr01_rehearsal",
        "-t",
        "-A",
        "-c",
        `SELECT count(*)::text FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = ANY(ARRAY[${c1List}]);`,
      ],
      30,
      env
    );
    const anonCount = await runTimed(
      "anon policy count",
      pgBin("psql.exe"),
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "-d",
        "sr01_rehearsal",
        "-t",
        "-A",
        "-c",
        `SELECT count(*)::text FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = ANY(ARRAY[${c1List}]) AND EXISTS (SELECT 1 FROM pg_roles r WHERE r.oid = ANY(p.polroles) AND r.rolname = 'anon');`,
      ],
      30,
      env
    );
    const helperList = SR01_HELPERS.map((h) => `'${h}'`).join(",");
    const helperSql = `SELECT count(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname IN (${helperList});`;
    const sr01Helpers = await runTimed(
      "helper count",
      pgBin("psql.exe"),
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "-d",
        "sr01_rehearsal",
        "-t",
        "-A",
        "-c",
        helperSql,
      ],
      30,
      env
    );
    if (policyCount !== "148") throw new Error(`C1 policy count expected 148 got ${policyCount}`);
    if (anonCount !== "74") throw new Error(`anon policy count expected 74 got ${anonCount}`);
    if (sr01Helpers !== "0") throw new Error(`pre-SR-01 helper count expected 0 got ${sr01Helpers}`);
    gateLine("3.5", "PASS", `policies=${policyCount} anon=${anonCount} sr01_helpers=${sr01Helpers}`);

    gate = "4-rollback";
    step("validate rollback SQL structure (static)");
    const rb = readFileSync(resolve(REPO, ROLLBACK), "utf8");
    assert.match(rb, /SR-01 rollback/);
    assert.match(rb, /clients_select_anon/);
    assert.match(rb, /soda_is_domain_founder/);
    assert.match(rb, /soda_can_access_client/);
    gateLine("4", "PASS", "rollback structure validated (static)");

    gate = "4b-prereq";
    const squadCol = await runTimed(
      "squad_member_ids column check",
      pgBin("psql.exe"),
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "-d",
        "sr01_rehearsal",
        "-t",
        "-A",
        "-c",
        `SELECT count(*)::text FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'squad_member_ids';`,
      ],
      30,
      env
    );
    if (squadCol === "0") {
      step("apply prerequisite smart_order_engine_v3 migration (production parity)");
      assert.ok(existsSync(resolve(REPO, PREREQ_MIGRATION)), "prerequisite migration missing");
      await runTimed(
        "prerequisite migration",
        pgBin("psql.exe"),
        [
          "-h",
          "127.0.0.1",
          "-p",
          String(port),
          "-U",
          "postgres",
          "-d",
          "sr01_rehearsal",
          "-v",
          "ON_ERROR_STOP=1",
          "-f",
          resolve(REPO, PREREQ_MIGRATION),
        ],
        120,
        env
      );
      gateLine("4b", "PASS", "prerequisite schema applied (squad_member_ids)");
    } else {
      gateLine("4b", "PASS", "prerequisite schema already present");
    }

    gate = "5-migration";
    step("apply SR-01 migration (timeout 180s)");
    await runTimed(
      "apply SR-01",
      pgBin("psql.exe"),
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "-d",
        "sr01_rehearsal",
        "-v",
        "ON_ERROR_STOP=1",
        "-f",
        resolve(REPO, MIGRATION),
      ],
      180,
      env
    );
    const sr01After = await runTimed(
      "post-migration helpers",
      pgBin("psql.exe"),
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "-d",
        "sr01_rehearsal",
        "-t",
        "-A",
        "-c",
        helperSql,
      ],
      30,
      env
    );
    if (sr01After !== "12") throw new Error(`post-migration SR-01 helpers expected 12 got ${sr01After}`);
    gateLine("5", "PASS", `SR-01 migration applied; helpers=${sr01After}`);

    gate = "5b-harness";
    step("run verify-sr01-rls.ts --live against disposable");
    const dbUrl = `postgresql://postgres:${encodeURIComponent(pgPass)}@127.0.0.1:${port}/sr01_rehearsal`;
    const readyBeforeVerify = spawnSync(
      pgBin("pg_isready.exe"),
      ["-h", "127.0.0.1", "-p", String(port), "-U", "postgres"],
      { windowsHide: true, shell: false }
    );
    if (readyBeforeVerify.status !== 0) {
      throw new Error(`cluster not ready before verify harness (port ${port})`);
    }
    const verifyEnv: Record<string, string | undefined> = {
      ...process.env,
      DATABASE_URL: dbUrl,
    };
    delete verifyEnv.SUPABASE_DB_PASSWORD;
    delete verifyEnv.SUPABASE_DB_URL;
    delete verifyEnv.DIRECT_URL;
    delete verifyEnv.NEXT_PUBLIC_SUPABASE_URL;
    const verify = spawnSync(
      "npx",
      ["tsx", "scripts/verify-sr01-rls.ts", "--live"],
      {
        cwd: REPO,
        encoding: "utf8",
        windowsHide: true,
        shell: true,
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 120_000,
        env: verifyEnv as NodeJS.ProcessEnv,
      }
    );
    if (verify.stdout) process.stdout.write(verify.stdout);
    if (verify.stderr) process.stderr.write(verify.stderr);
    if (verify.error?.message?.includes("ETIMEDOUT")) {
      throw new Error("verify-sr01-rls.ts --live BLOCKED — timeout after 120s");
    }
    if (verify.status !== 0) {
      const detail = (verify.stderr || verify.stdout || verify.error?.message || "").trim();
      throw new Error(`verify-sr01-rls.ts --live failed: ${detail || `exit ${verify.status}`}`);
    }
    gateLine("5b", "PASS", "live harness on disposable cluster");

    gate = "3-cleanup";
    step("stop and remove disposable cluster");
    gateLine("3", "PASS", "disposable rehearsal complete (Gates 3-5)");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const blocked = msg.includes("BLOCKED");
    gateLine(gate, blocked ? "BLOCKED" : "FAIL", msg);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

main();
