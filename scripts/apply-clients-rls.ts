/**
 * Apply Sprint 17 clients RLS SQL when SUPABASE_DB_PASSWORD (or DATABASE_URL) is set.
 *
 * Run: npm run db:clients-rls
 *
 * Without a DB password this prints the SQL path for Dashboard paste.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadEnvLocal, maskSecret } from "./load-env-local";

const MIGRATION = "supabase/migrations/20260711000002_clients_rls.sql";

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

  console.log("=== Apply clients RLS ===");
  console.log(`  migration: ${MIGRATION}`);
  console.log(`  DATABASE_URL: ${maskSecret(databaseUrl)}`);
  console.log(`  SUPABASE_DB_PASSWORD: ${maskSecret(password)}`);
  console.log(`  project ref: ${ref ?? "(unknown)"}`);

  let connectionString = databaseUrl;
  if (!connectionString && password && ref) {
    // Direct connection (IPv6 / network dependent). Pooler session mode as fallback.
    connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }

  if (!connectionString) {
    console.log(`
Blocked: no DATABASE_URL or SUPABASE_DB_PASSWORD.

Run this SQL once in Supabase Dashboard → SQL Editor:

  ${MIGRATION}

Or add to .env.local:
  SUPABASE_DB_PASSWORD=<database password from Project Settings → Database>
  # or SUPABASE_SERVICE_ROLE_KEY=<service_role> so the app bypasses RLS
`);
    process.exit(1);
  }

  try {
    await applyWithPg(connectionString, sql);
    console.log("Applied via direct db.*.supabase.co:5432");
    process.exit(0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`Direct connection failed: ${msg}`);
  }

  if (password && ref) {
    const pooler = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
    try {
      await applyWithPg(pooler, sql);
      console.log("Applied via pooler aws-0-eu-central-1:6543");
      process.exit(0);
    } catch (err) {
      console.log(
        `Pooler eu-central-1 failed: ${err instanceof Error ? err.message : err}`
      );
    }

    // Try common regions
    for (const region of [
      "eu-west-1",
      "eu-west-2",
      "us-east-1",
      "us-west-1",
      "ap-southeast-1",
    ]) {
      const uri = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
      try {
        await applyWithPg(uri, sql);
        console.log(`Applied via pooler aws-0-${region}:6543`);
        process.exit(0);
      } catch {
        // try next
      }
    }
  }

  console.error("Could not apply RLS SQL automatically.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
