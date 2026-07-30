/**
 * Apply ONLY migration 20260730000035 (client privacy — non-Founder denied).
 * Parses DATABASE_URL in memory into PG* env vars — never on command line.
 * Does NOT create or modify supabase_migrations.schema_migrations.
 *
 * Usage:
 *   npx tsx scripts/apply-client-privacy-secure.ts
 *   npx tsx scripts/apply-client-privacy-secure.ts --rollback
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
  "supabase/migrations/20260730000035_client_privacy_non_founder.sql";
const ROLLBACK_FILE =
  "supabase/migrations/rollback/20260730000035_client_privacy_non_founder_rollback.sql";

async function main(): Promise<void> {
  const rollback = process.argv.includes("--rollback");
  const dbUrl = requireDatabaseUrl();
  const sqlPath = rollback ? ROLLBACK_FILE : MIGRATION_FILE;
  const sql = readFileSync(resolve(process.cwd(), sqlPath), "utf8");

  console.log("apply-client-privacy-secure\n");
  console.log(`  mode:     ${rollback ? "ROLLBACK 000035" : "APPLY 000035 only"}`);
  console.log(`  database: ${maskDatabaseUrl(dbUrl)}`);
  console.log(`  sql:      ${sqlPath}`);
  console.log("  note:     schema_migrations not modified (history debt follow-up)\n");

  applyPgEnvFromUrl(dbUrl);
  try {
    await withPgEnv(async (client) => {
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`PASS  ${rollback ? "Rollback" : "Apply"} 000035 committed.`);
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
