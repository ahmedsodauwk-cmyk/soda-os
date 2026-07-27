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

async function applyWithPg(connectionString: string, sql: string) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

async function connectAndApply(connectionString: string, sql: string) {
  await applyWithPg(connectionString, sql);
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

async function tryApply(sql: string): Promise<boolean> {
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    process.env.POSTGRES_PASSWORD?.trim();
  const ref = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  const direct = await resolveConnectionString();
  if (direct) {
    try {
      await connectAndApply(direct, sql);
      console.log("  OK (direct)");
      return true;
    } catch (err) {
      console.log(
        `  direct failed: ${err instanceof Error ? err.message : err}`
      );
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
      try {
        await connectAndApply(uri, sql);
        console.log(`  OK (pooler ${region})`);
        return true;
      } catch {
        // try next region
      }
    }
  }

  return false;
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
    const ok = await tryApply(sql);
    if (!ok) {
      console.error("  FAILED: no working database connection");
      process.exit(1);
    }
  }

  console.log("\nAll H remediation migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
