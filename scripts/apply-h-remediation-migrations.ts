/**
 * Apply H1–H5 remediation migrations to Production (sequential).
 * Run: npx tsx scripts/apply-h-remediation-migrations.ts
 *
 * Requires DATABASE_URL or SUPABASE_DB_PASSWORD + NEXT_PUBLIC_SUPABASE_URL.
 * Never prints secrets.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadEnvLocal, maskSecret } from "./load-env-local";

const MIGRATIONS = [
  "supabase/migrations/20260727000029_h1_connect_peer_directory.sql",
  "supabase/migrations/20260727000030_h2_connect_storage_select.sql",
  "supabase/migrations/20260727000031_h4_handle_new_user_harden.sql",
  "supabase/migrations/20260727000032_h5_connect_messages_update.sql",
] as const;

function projectRefFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.split(".")[0] || undefined;
  } catch {
    return undefined;
  }
}

type ApplyOutcome =
  | { status: "ok" }
  | { status: "connection_failed"; message: string }
  | { status: "sql_failed"; message: string };

async function applyWithPg(
  connectionString: string,
  sql: string
): Promise<ApplyOutcome> {
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
  } catch (err) {
    return {
      status: "connection_failed",
      message: err instanceof Error ? err.message : String(err),
    };
  }
  try {
    await client.query(sql);
    return { status: "ok" };
  } catch (err) {
    return {
      status: "sql_failed",
      message: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await client.end();
  }
}

async function resolveConnectionString(): Promise<string | null> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    process.env.POSTGRES_PASSWORD?.trim();
  const ref = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (databaseUrl) return databaseUrl;
  if (password && ref) {
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }
  return null;
}

async function tryApply(sql: string): Promise<ApplyOutcome> {
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    process.env.POSTGRES_PASSWORD?.trim();
  const ref = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  let sawConnectionFailure = false;
  let lastSqlError: string | undefined;

  const direct = await resolveConnectionString();
  if (direct) {
    const outcome = await applyWithPg(direct, sql);
    if (outcome.status === "ok") {
      console.log("  OK (direct)");
      return outcome;
    }
    if (outcome.status === "sql_failed") {
      console.error(`  SQL error (direct): ${outcome.message}`);
      lastSqlError = outcome.message;
    } else {
      console.log(`  direct connection failed: ${outcome.message}`);
      sawConnectionFailure = true;
    }
  }

  if (password && ref) {
    for (const region of [
      "eu-central-1",
      "eu-west-1",
      "eu-west-2",
      "us-east-1",
      "us-west-1",
      "ap-southeast-1",
    ]) {
      const uri = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
      const outcome = await applyWithPg(uri, sql);
      if (outcome.status === "ok") {
        console.log(`  OK (pooler ${region})`);
        return outcome;
      }
      if (outcome.status === "sql_failed") {
        console.error(`  SQL error (pooler ${region}): ${outcome.message}`);
        lastSqlError = outcome.message;
      } else {
        sawConnectionFailure = true;
      }
    }
  }

  if (lastSqlError) {
    return { status: "sql_failed", message: lastSqlError };
  }
  if (sawConnectionFailure || direct || (password && ref)) {
    return { status: "connection_failed", message: "no working database connection" };
  }
  return { status: "connection_failed", message: "no DATABASE_URL or credentials" };
}

async function main() {
  loadEnvLocal();

  console.log("=== Apply H1–H5 remediation migrations ===");
  console.log(`  DATABASE_URL: ${maskSecret(process.env.DATABASE_URL)}`);
  console.log(
    `  SUPABASE_DB_PASSWORD: ${maskSecret(process.env.SUPABASE_DB_PASSWORD)}`
  );
  console.log(
    `  project ref: ${projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? "(unknown)"}`
  );

  if (!resolveConnectionString() && !process.env.SUPABASE_DB_PASSWORD?.trim()) {
    console.log("\nBLOCKED: no DATABASE_URL or SUPABASE_DB_PASSWORD.");
    console.log("FOUNDER EXTERNAL ACTION REQUIRED — DATABASE BACKUP SECRET ENTRY");
    process.exit(2);
  }

  for (const rel of MIGRATIONS) {
    const sql = readFileSync(resolve(process.cwd(), rel), "utf8");
    console.log(`Applying ${rel} ...`);
    const outcome = await tryApply(sql);
    if (outcome.status === "sql_failed") {
      console.error(`  FAILED: migration SQL error — ${outcome.message}`);
      process.exit(1);
    }
    if (outcome.status !== "ok") {
      console.error(`  FAILED: ${outcome.message}`);
      process.exit(1);
    }
  }

  console.log("\nAll H remediation migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
