/**
 * H1 migration disposable rehearsal — minimal schema matching Production types.
 * Never prints passwords, connection strings, or row contents.
 *
 * Run: npx tsx scripts/verify-h1-disposable.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
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
const H1_MIGRATION =
  "supabase/migrations/20260727000029_h1_connect_peer_directory.sql";

const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\..+/, "")
  .replace("T", "-");
const workDir = join(tmpdir(), `h1-disposable-${stamp}`);
const dataDir = join(workDir, "pgdata");

let pgPass = "";
let pgStarted = false;
let port = 0;

function pgBin(name: string): string {
  return join(PG_BIN, name);
}

function step(msg: string): void {
  console.log(`[H1-DISPOSABLE] ${msg}`);
}

async function findFreePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("no port"));
        return;
      }
      const p = addr.port;
      srv.close(() => resolvePort(p));
    });
    srv.on("error", reject);
  });
}

function runSync(
  cmd: string,
  args: string[],
  env: Record<string, string> = {}
) {
  const r = spawnSync(cmd, args, {
    env: { ...process.env, ...env },
    windowsHide: true,
    shell: false,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    const detail = (r.stderr || r.stdout || "").trim().slice(0, 500);
    throw new Error(
      `${cmd} failed (exit ${r.status})${detail ? `: ${detail}` : ""}`
    );
  }
  return r.stdout ?? "";
}

function psqlFile(file: string, env: Record<string, string>, db = "h1_rehearsal") {
  runSync(
    pgBin("psql.exe"),
    [
      "-h",
      "127.0.0.1",
      "-p",
      String(port),
      "-U",
      "postgres",
      "-d",
      db,
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      file,
    ],
    env
  );
}

function psql(sql: string, env: Record<string, string>, db = "h1_rehearsal") {
  return runSync(
    pgBin("psql.exe"),
    [
      "-h",
      "127.0.0.1",
      "-p",
      String(port),
      "-U",
      "postgres",
      "-d",
      db,
      "-v",
      "ON_ERROR_STOP=1",
      "-tAc",
      sql,
    ],
    env
  );
}

function cleanup(): void {
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

async function main(): Promise<void> {
  assert.ok(existsSync(pgBin("initdb.exe")), "PostgreSQL 18 tools missing");
  assert.ok(existsSync(resolve(REPO, H1_MIGRATION)), "H1 migration missing");

  port = await findFreePort();
  mkdirSync(workDir, { recursive: true });
  pgPass = randomBytes(32).toString("base64url");
  const pwFile = join(workDir, "pgpass.txt");
  writeFileSync(pwFile, pgPass, "ascii");

  step(`init disposable cluster on port ${port}`);
  runSync(pgBin("initdb.exe"), [
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
  ]);
  writeFileSync(
    join(dataDir, "pg_hba.conf"),
    readFileSync(join(dataDir, "pg_hba.conf"), "utf8") +
      "\nhost all all 127.0.0.1/32 scram-sha-256\n",
    "utf8"
  );
  const pgCtl = spawnSync(
    pgBin("pg_ctl.exe"),
    [
      "-D",
      dataDir,
      "-l",
      join(workDir, "postgres.log"),
      "-o",
      `-p ${port} -c listen_addresses=127.0.0.1`,
      "start",
    ],
    { windowsHide: true, shell: false, encoding: "utf8", timeout: 30_000 }
  );
  if (pgCtl.status !== 0) {
    throw new Error(`pg_ctl start failed: ${(pgCtl.stderr || pgCtl.stdout || "").trim()}`);
  }
  pgStarted = true;

  let ready = false;
  for (let i = 0; i < 60; i++) {
    const probe = spawnSync(
      pgBin("pg_isready.exe"),
      ["-h", "127.0.0.1", "-p", String(port), "-U", "postgres"],
      { windowsHide: true, shell: false }
    );
    if (probe.status === 0) {
      ready = true;
      break;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
  }
  if (!ready) throw new Error(`PostgreSQL not ready on port ${port}`);

  const env = { PGPASSWORD: pgPass };

  step("bootstrap minimal Production-shaped schema");
  const bootstrapPath = join(workDir, "bootstrap.sql");
  writeFileSync(
    bootstrapPath,
    `
CREATE SCHEMA auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;

CREATE ROLE authenticated NOLOGIN;
GRANT USAGE ON SCHEMA public TO authenticated;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  username text,
  access_level text,
  person_id text,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.connect_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE public.connect_conversation_members (
  conversation_id uuid NOT NULL REFERENCES public.connect_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  left_at timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE OR REPLACE FUNCTION public.soda_is_domain_founder()
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT false $$;

CREATE OR REPLACE FUNCTION public.connect_viewer_is_active()
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT true $$;

CREATE POLICY profiles_select_connect_peers ON public.profiles
  FOR SELECT TO authenticated
  USING (coalesce(is_active, false) = true);
`,
    "utf8"
  );
  runSync(pgBin("createdb.exe"), [
    "-h",
    "127.0.0.1",
    "-p",
    String(port),
    "-U",
    "postgres",
    "h1_rehearsal",
  ], env);
  psqlFile(bootstrapPath, env);

  step("verify profiles.person_id is text (pre-H1)");
  const personType = psql(
    `SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='person_id';`,
    env
  ).trim();
  assert.match(personType, /text/, `expected person_id text, got: ${personType}`);

  step("apply H1 migration");
  const h1Path = join(workDir, "h1.sql");
  writeFileSync(
    h1Path,
    readFileSync(resolve(REPO, H1_MIGRATION), "utf8"),
    "utf8"
  );
  psqlFile(h1Path, env);

  step("verify H1 RPCs and policy state");
  const fnCount = psql(
    `SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname IN ('connect_list_directory_peers', 'connect_get_peers_by_ids', 'connect_shares_active_conversation');`,
    env
  ).trim();
  assert.equal(fnCount, "3", `expected 3 H1 functions, got ${fnCount}`);

  const policyGone = psql(
    `SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select_connect_peers';`,
    env
  ).trim();
  assert.equal(policyGone, "0", "profiles_select_connect_peers should be dropped");

  const outCols = psql(
    `SELECT pg_get_function_result(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname='public' AND p.proname='connect_list_directory_peers' LIMIT 1;`,
    env
  ).trim();
  assert.match(
    outCols,
    /person_id text/,
    `connect_list_directory_peers should declare person_id text, got: ${outCols}`
  );

  console.log("\nH1 disposable rehearsal PASS");
}

main()
  .then(() => {
    cleanup();
    process.exit(0);
  })
  .catch((err) => {
    console.error(
      `H1 DISPOSABLE FAILED: ${err instanceof Error ? err.message : err}`
    );
    cleanup();
    process.exit(1);
  });
