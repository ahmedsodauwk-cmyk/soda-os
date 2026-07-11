/**
 * Apply Smart Order Engine V3 migration when DATABASE_URL / SUPABASE_DB_PASSWORD is set.
 * Run: NODE_OPTIONS=--use-system-ca npx tsx scripts/apply-smart-order-migration.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadEnvLocal, maskSecret } from "./load-env-local";

const MIGRATION =
  "supabase/migrations/20260711000004_smart_order_engine_v3.sql";

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

  console.log("=== Apply Smart Order Engine V3 migration ===");
  console.log(`  migration: ${MIGRATION}`);
  console.log(`  DATABASE_URL: ${maskSecret(databaseUrl)}`);
  console.log(`  SUPABASE_DB_PASSWORD: ${maskSecret(password)}`);
  console.log(`  project ref: ${ref ?? "(unknown)"}`);

  let connectionString = databaseUrl;
  if (!connectionString && password && ref) {
    connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }

  if (!connectionString) {
    console.log(`
Blocked: no DATABASE_URL or SUPABASE_DB_PASSWORD.
Paste ${MIGRATION} into Supabase Dashboard → SQL Editor.
`);
    process.exit(1);
  }

  try {
    await applyWithPg(connectionString, sql);
    console.log("Applied via direct connection");
    process.exit(0);
  } catch (err) {
    console.log(
      `Direct connection failed: ${err instanceof Error ? err.message : err}`
    );
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
        await applyWithPg(uri, sql);
        console.log(`Applied via pooler aws-0-${region}:6543`);
        process.exit(0);
      } catch {
        // try next
      }
    }
  }

  console.error("Could not apply migration automatically.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
