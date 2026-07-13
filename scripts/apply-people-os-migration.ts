/**
 * Apply People OS foundation migration.
 * Run: npx tsx scripts/apply-people-os-migration.ts
 *
 * DOES NOT create Auth users or crew/people accounts.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadEnvLocal, maskSecret } from "./load-env-local";

const MIGRATION =
  "supabase/migrations/20260713000013_people_os_foundation.sql";

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

async function main() {
  loadEnvLocal();
  const sqlPath = resolve(process.cwd(), MIGRATION);
  const sql = readFileSync(sqlPath, "utf8");

  const databaseUrl = process.env.DATABASE_URL?.trim();
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    process.env.POSTGRES_PASSWORD?.trim();
  const ref = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  console.log("=== Apply People OS foundation migration ===");
  console.log(`  migration: ${MIGRATION}`);
  console.log(`  DATABASE_URL: ${maskSecret(databaseUrl)}`);
  console.log(`  SUPABASE_DB_PASSWORD: ${maskSecret(password)}`);
  console.log(`  project ref: ${ref ?? "(unknown)"}`);
  console.log("  NOTE: This migration does NOT create Auth users or people rows.");

  let connectionString = databaseUrl;
  if (!connectionString && password && ref) {
    connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }

  if (!connectionString) {
    console.log(`
Blocked: no DATABASE_URL or SUPABASE_DB_PASSWORD.
Paste into Supabase Dashboard → SQL Editor:
  ${MIGRATION}
`);
    process.exit(1);
  }

  try {
    await applyWithPg(connectionString, sql);
    console.log("Applied via direct connection");
    console.log("People OS schema ready — awaiting Founder crew list for accounts.");
    process.exit(0);
  } catch (err) {
    console.log(
      `Direct connection failed: ${err instanceof Error ? err.message : err}`
    );
    console.log(`Paste into Supabase Dashboard → SQL Editor:\n  ${MIGRATION}`);
    process.exit(1);
  }
}

main();
