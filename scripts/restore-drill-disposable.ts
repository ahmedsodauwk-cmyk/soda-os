/**
 * Phase 4 — Restore drill: disposable PG 18 cluster from Production backup.
 * Never prints passwords, connection strings, or row contents.
 *
 * Run: npx tsx scripts/restore-drill-disposable.ts
 */
import assert from "node:assert/strict";
import { spawn, spawnSync, type StdioOptions } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

const PG_BIN = "C:\\Program Files\\PostgreSQL\\18\\bin";
const BACKUP_ZIP =
  "D:\\SODA OS\\Database\\SODA_Database_2026-07-26_195823.zip";

const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\..+/, "")
  .replace("T", "-");
const workDir = join(tmpdir(), `restore-drill-${stamp}`);
const dataDir = join(workDir, "pgdata");
const pwFile = join(workDir, "pgpass.txt");
const logFile = join(workDir, "postgres.log");
const restoreLog = join(workDir, "restore.log");

let pgPass = "";
let pgStarted = false;
let port = 0;

function pgBin(name: string): string {
  return join(PG_BIN, name);
}

function step(msg: string): void {
  console.log(`[RESTORE-DRILL] ${msg}`);
}

function gateLine(name: string, status: string, detail = ""): void {
  const suffix = detail ? ` - ${detail}` : "";
  console.log(`GATE ${name} : ${status}${suffix}`);
}

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("no port"));
        return;
      }
      const p = addr.port;
      srv.close(() => resolve(p));
    });
    srv.on("error", reject);
  });
}

function runSync(cmd: string, args: string[], env: Record<string, string> = {}) {
  const r = spawnSync(cmd, args, {
    env: { ...process.env, ...env },
    windowsHide: true,
    shell: false,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    throw new Error(`${cmd} failed (exit ${r.status})`);
  }
  return r.stdout ?? "";
}

async function main() {
  step("verify backup artifact exists");
  assert.ok(existsSync(BACKUP_ZIP), `missing backup: ${BACKUP_ZIP}`);
  gateLine("2", "PASS", "backup artifact readable");

  mkdirSync(workDir, { recursive: true });
  pgPass = randomBytes(16).toString("hex");
  writeFileSafe(pwFile, pgPass);
  port = await findFreePort();

  step(`init disposable cluster on port ${port}`);
  runSync(pgBin("initdb.exe"), ["-D", dataDir, "-U", "postgres", "-A", "scram-sha-256"]);
  runSync(pgBin("pg_ctl.exe"), [
    "start",
    "-D",
    dataDir,
    "-l",
    logFile,
    "-o",
    `-p ${port}`,
  ]);
  pgStarted = true;

  const env = {
    PGPASSWORD: pgPass,
    PGPORT: String(port),
  };

  step("create soda_restore role and database");
  runSync(pgBin("psql.exe"), ["-U", "postgres", "-h", "127.0.0.1", "-d", "postgres", "-c", "CREATE DATABASE soda_restore;"], env);

  step("extract and restore pg_dump from ZIP (schema+data)");
  const extractDir = join(workDir, "extract");
  mkdirSync(extractDir, { recursive: true });
  runSync("powershell", [
    "-NoProfile",
    "-Command",
    `Expand-Archive -LiteralPath '${BACKUP_ZIP.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`,
  ]);

  const sqlFiles = findSqlDump(extractDir);
  assert.ok(sqlFiles.length > 0, "no SQL dump in backup ZIP");
  for (const sql of sqlFiles) {
    runSync(
      pgBin("psql.exe"),
      ["-U", "postgres", "-h", "127.0.0.1", "-d", "soda_restore", "-f", sql],
      { ...env, ...{ PGOPTIONS: "-c client_min_messages=warning" } }
    );
  }

  step("verify core catalog objects post-restore");
  const tables = runSync(
    pgBin("psql.exe"),
    [
      "-U",
      "postgres",
      "-h",
      "127.0.0.1",
      "-d",
      "soda_restore",
      "-tAc",
      "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';",
    ],
    env
  ).trim();
  assert.ok(Number(tables) >= 20, `expected public tables, got ${tables}`);
  gateLine("4", "PASS", `disposable restore OK (${tables} public tables)`);

  console.log("\nRestore drill complete — disposable cluster only (not Production).");
}

function writeFileSafe(path: string, content: string) {
  const { writeFileSync } = require("node:fs") as typeof import("node:fs");
  writeFileSync(path, content, { encoding: "utf8" });
}

function findSqlDump(dir: string): string[] {
  const { readdirSync, statSync } = require("node:fs") as typeof import("node:fs");
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...findSqlDump(full));
    else if (name.endsWith(".sql") && !name.includes("rollback")) out.push(full);
  }
  return out;
}

function cleanup() {
  if (pgStarted) {
    try {
      spawnSync(pgBin("pg_ctl.exe"), ["stop", "-D", dataDir, "-m", "fast"], {
        windowsHide: true,
        shell: false,
      });
    } catch {
      /* ignore */
    }
  }
  try {
    rmSync(workDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

main()
  .then(() => {
    cleanup();
    process.exit(0);
  })
  .catch((err) => {
    console.error(`RESTORE DRILL FAILED: ${err instanceof Error ? err.message : err}`);
    cleanup();
    process.exit(1);
  });
