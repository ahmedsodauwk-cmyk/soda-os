/**
 * Apply ONLY migration 20260728000034 (founder-only UPDATE/DELETE).
 * Parses DATABASE_URL in memory into PG* env vars — never on command line.
 * Does NOT create or modify supabase_migrations.schema_migrations.
 *
 * Usage:
 *   npx tsx scripts/apply-founder-only-rls-secure.ts
 *   npx tsx scripts/apply-founder-only-rls-secure.ts --rollback
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  applyPgEnvFromUrl,
  clearPgEnv,
  maskDatabaseUrl,
  redactSecrets,
  requireDatabaseUrl,
  withPgEnv,
} from "./db-secure-connection";

const MIGRATION_FILE =
  "supabase/migrations/20260728000034_founder_only_update_delete.sql";
const ROLLBACK_FILE =
  "supabase/migrations/rollback/20260728000034_founder_only_update_delete_rollback.sql";

const PERSONAL_BRAIN_TABLES = [
  "personal_brain_entries",
  "personal_brain_entry_history",
  "personal_brain_chat_messages",
] as const;

async function personalBrainPresent(
  client: import("pg").Client
): Promise<boolean> {
  const r = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = ANY($1::text[])
         AND c.relkind = 'r'
     ) AS exists`,
    [PERSONAL_BRAIN_TABLES]
  );
  return r.rows[0]?.exists === true;
}

async function main(): Promise<void> {
  const rollback = process.argv.includes("--rollback");
  const dbUrl = requireDatabaseUrl();
  const sqlPath = rollback ? ROLLBACK_FILE : MIGRATION_FILE;
  const sql = readFileSync(resolve(process.cwd(), sqlPath), "utf8");

  console.log("apply-founder-only-rls-secure\n");
  console.log(`  mode:     ${rollback ? "ROLLBACK 000034" : "APPLY 000034 only"}`);
  console.log(`  database: ${maskDatabaseUrl(dbUrl)}`);
  console.log(`  sql:      ${sqlPath}`);
  console.log("  note:     schema_migrations not modified (history debt follow-up)\n");

  applyPgEnvFromUrl(dbUrl);
  try {
    await withPgEnv(async (client) => {
      if (await personalBrainPresent(client)) {
        console.error(
          "FAIL  000033 Personal Brain tables present — aborting (must stay off)."
        );
        process.exit(11);
      }

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`PASS  ${rollback ? "Rollback" : "Apply"} 000034 committed.`);
      } catch (err) {
        await client.query("ROLLBACK");
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`FAIL  transaction rolled back: ${redactSecrets(msg)}`);
        process.exit(1);
      }
    });
  } finally {
    clearPgEnv();
  }
}

main().catch((err: unknown) => {
  clearPgEnv();
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\nFAIL  ${redactSecrets(msg)}`);
  process.exit(1);
});
