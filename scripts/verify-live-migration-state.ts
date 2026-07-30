/**
 * Live migration reconciliation — reads DATABASE_URL from process env only.
 * Never loads .env.local. Never prints secrets.
 *
 * Exit codes:
 *   0  — 000034 policies match catalog (skip reapply); 000033 NOT present
 *  10 — 000034 missing or policies mismatch (apply required)
 *  11 — 000033 present on Production (fatal — must not apply)
 *   1  — catalog query failure or other error
 *
 * Run:
 *   npx tsx scripts/verify-live-migration-state.ts
 *   npx tsx scripts/verify-live-migration-state.ts --static
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  maskDatabaseUrl,
  redactSecrets,
  requireDatabaseUrl,
  withPg,
} from "./db-secure-connection";

const MIGRATION_033 = "20260728000033";
const MIGRATION_034 = "20260728000034";
const MIGRATION_033_FILE =
  "supabase/migrations/20260728000033_personal_brain_foundation.sql";
const MIGRATION_034_FILE =
  "supabase/migrations/20260728000034_founder_only_update_delete.sql";

const LOCKDOWN_TABLES = [
  "clients",
  "projects",
  "orders",
  "order_assignments",
  "quotations",
  "deliveries",
  "files",
] as const;

const EXPECTED_POLICIES: Record<string, string[]> = {
  clients: ["sr01_clients_update", "sr01_clients_delete"],
  projects: ["sr01_projects_update"],
  orders: ["sr01_orders_update", "sr01_orders_delete"],
  order_assignments: ["sr01_order_assignments_write"],
  quotations: ["sr01_quotations_update", "sr01_quotations_delete"],
  deliveries: ["sr01_deliveries_write"],
  files: ["sr01_files_write"],
};

/** Catalog signatures from 000033 migration SQL. */
const PERSONAL_BRAIN_CATALOG = {
  tables: [
    "personal_brain_entries",
    "personal_brain_entry_history",
    "personal_brain_chat_messages",
  ],
  functions: [
    "is_personal_brain_owner",
    "personal_brain_entries_set_updated_at",
  ],
  policies: [
    "personal_brain_entries_owner_all",
    "personal_brain_history_owner_select",
    "personal_brain_history_owner_insert",
    "personal_brain_chat_owner_all",
  ],
  indexes: [
    "personal_brain_entries_owner_idx",
    "personal_brain_entry_history_entry_idx",
    "personal_brain_chat_messages_owner_idx",
  ],
  triggers: ["personal_brain_entries_set_updated_at"],
} as const;

export interface MigrationStateResult {
  migrationHistoryAvailable: boolean;
  historyHas033: boolean | null;
  historyHas034: boolean | null;
  personalBrainCatalog: Record<string, boolean>;
  personalBrainFullyPresent: boolean;
  personalBrainFullyAbsent: boolean;
  policiesMatch: boolean;
  policyMismatches: string[];
}

function normalizePgTextArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || value.length === 0) return [];
  const trimmed = value.replace(/^\{|\}$/g, "");
  if (!trimmed) return [];
  return trimmed.split(",").map((s) => s.replace(/^"|"$/g, ""));
}

function policyIsFounderOnly(qual: string | null, withCheck: string | null): boolean {
  const text = `${qual ?? ""} ${withCheck ?? ""}`;
  if (!/soda_is_domain_founder\s*\(\s*\)/i.test(text)) return false;
  if (/soda_can_access_/i.test(text)) return false;
  if (/soda_profile_access_level/i.test(text)) return false;
  return true;
}

function runStaticChecks(): void {
  console.log("verify-live-migration-state (static)\n");

  const migration033 = readFileSync(resolve(process.cwd(), MIGRATION_033_FILE), "utf8");
  const migration034 = readFileSync(resolve(process.cwd(), MIGRATION_034_FILE), "utf8");

  assert.match(migration033, /personal_brain_entries/);
  assert.match(migration033, /is_personal_brain_owner/);
  assert.match(migration034, /soda_is_domain_founder/);

  for (const table of LOCKDOWN_TABLES) {
    const names = EXPECTED_POLICIES[table];
    assert.ok(names && names.length > 0, `expected policies for ${table}`);
    for (const name of names) {
      assert.match(migration034, new RegExp(name));
    }
  }

  console.log("PASS  migration SQL files and policy catalog signatures OK");
  console.log("PASS  static mode — no DATABASE_URL required");
}

async function inspectLiveCatalog(
  client: import("pg").Client
): Promise<MigrationStateResult> {
  const historyCheck = await client.query<{ migration_history_relation: string | null }>(
    `SELECT to_regclass('supabase_migrations.schema_migrations') AS migration_history_relation`
  );
  const migrationHistoryAvailable =
    historyCheck.rows[0]?.migration_history_relation !== null;

  let historyHas033: boolean | null = null;
  let historyHas034: boolean | null = null;

  if (migrationHistoryAvailable) {
    const applied = await client.query<{ version: string }>(
      `SELECT version FROM supabase_migrations.schema_migrations
       WHERE version = ANY($1::text[])`,
      [[MIGRATION_033, MIGRATION_034]]
    );
    const versions = new Set(applied.rows.map((r) => r.version));
    historyHas033 = versions.has(MIGRATION_033);
    historyHas034 = versions.has(MIGRATION_034);
    console.log(
      `  live schema_migrations 033: ${historyHas033 ? "APPLIED" : "not applied"}`
    );
    console.log(
      `  live schema_migrations 034: ${historyHas034 ? "APPLIED" : "not applied"}`
    );
  } else {
    console.log("\n  WARNING — REMOTE MIGRATION HISTORY TABLE ABSENT");
    console.log("  migrationHistoryAvailable: false");
    console.log(
      "  MIGRATION HISTORY TRACKING NOT INITIALIZED — FOLLOW-UP REQUIRED"
    );
    console.log("  (000033/000034 status determined from PostgreSQL catalog only)");
  }

  const personalBrainCatalog: Record<string, boolean> = {};

  for (const table of PERSONAL_BRAIN_CATALOG.tables) {
    const r = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relname = $1 AND c.relkind = 'r'
       ) AS exists`,
      [table]
    );
    personalBrainCatalog[`table:${table}`] = r.rows[0]?.exists === true;
  }

  for (const fn of PERSONAL_BRAIN_CATALOG.functions) {
    const r = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = $1
       ) AS exists`,
      [fn]
    );
    personalBrainCatalog[`function:${fn}`] = r.rows[0]?.exists === true;
  }

  for (const idx of PERSONAL_BRAIN_CATALOG.indexes) {
    const r = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relname = $1 AND c.relkind = 'i'
       ) AS exists`,
      [idx]
    );
    personalBrainCatalog[`index:${idx}`] = r.rows[0]?.exists === true;
  }

  for (const pol of PERSONAL_BRAIN_CATALOG.policies) {
    const r = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_policy p
         JOIN pg_class c ON c.oid = p.polrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND p.polname = $1
       ) AS exists`,
      [pol]
    );
    personalBrainCatalog[`policy:${pol}`] = r.rows[0]?.exists === true;
  }

  for (const trg of PERSONAL_BRAIN_CATALOG.triggers) {
    const r = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_trigger t
         JOIN pg_class c ON c.oid = t.tgrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND NOT t.tgisinternal AND t.tgname = $1
       ) AS exists`,
      [trg]
    );
    personalBrainCatalog[`trigger:${trg}`] = r.rows[0]?.exists === true;
  }

  const presentKeys = Object.entries(personalBrainCatalog).filter(([, v]) => v);
  const absentKeys = Object.entries(personalBrainCatalog).filter(([, v]) => !v);
  const personalBrainFullyAbsent = presentKeys.length === 0;
  const personalBrainFullyPresent =
    absentKeys.length === 0 &&
    presentKeys.length ===
      PERSONAL_BRAIN_CATALOG.tables.length +
        PERSONAL_BRAIN_CATALOG.functions.length +
        PERSONAL_BRAIN_CATALOG.indexes.length +
        PERSONAL_BRAIN_CATALOG.policies.length +
        PERSONAL_BRAIN_CATALOG.triggers.length;

  if (personalBrainFullyAbsent) {
    console.log("\n  000033 catalog: PERSONAL BRAIN DATABASE FOUNDATION ABSENT");
  } else if (personalBrainFullyPresent) {
    console.log("\n  000033 catalog: PERSONAL BRAIN DATABASE FOUNDATION FULLY PRESENT");
  } else {
    console.log("\n  000033 catalog: PARTIAL personal brain objects detected:");
    for (const [key, present] of Object.entries(personalBrainCatalog)) {
      console.log(`    ${present ? "PRESENT" : "absent"}  ${key}`);
    }
  }

  const policyRows = await client.query<{
    tablename: string;
    policyname: string;
    cmd: string;
    qual: string | null;
    with_check: string | null;
    roles: string[];
  }>(
    `SELECT c.relname AS tablename, p.polname AS policyname,
            CASE p.polcmd
              WHEN 'r' THEN 'SELECT'
              WHEN 'a' THEN 'INSERT'
              WHEN 'w' THEN 'UPDATE'
              WHEN 'd' THEN 'DELETE'
              WHEN '*' THEN 'ALL'
              ELSE p.polcmd::text
            END AS cmd,
            pg_get_expr(p.polqual, p.polrelid) AS qual,
            pg_get_expr(p.polwithcheck, p.polrelid) AS with_check,
            ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(p.polroles)) AS roles
     FROM pg_policy p
     JOIN pg_class c ON c.oid = p.polrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = ANY($1::text[])`,
    [LOCKDOWN_TABLES]
  );

  const byTable = new Map<string, typeof policyRows.rows>();
  for (const row of policyRows.rows) {
    const list = byTable.get(row.tablename) ?? [];
    list.push(row);
    byTable.set(row.tablename, list);
  }

  const policyMismatches: string[] = [];

  for (const table of LOCKDOWN_TABLES) {
    const expectedNames = EXPECTED_POLICIES[table] ?? [];
    const rows = byTable.get(table) ?? [];
    for (const name of expectedNames) {
      const pol = rows.find((r) => r.policyname === name);
      if (!pol) {
        policyMismatches.push(`${table}.${name}: missing`);
        continue;
      }
      const roles = normalizePgTextArray(pol.roles);
      if (!roles.includes("authenticated")) {
        policyMismatches.push(`${table}.${name}: missing authenticated role`);
        continue;
      }
      const isWrite =
        pol.cmd === "UPDATE" || pol.cmd === "DELETE" || pol.cmd === "ALL";
      if (isWrite && !policyIsFounderOnly(pol.qual, pol.with_check)) {
        policyMismatches.push(`${table}.${name}: not founder-only lockdown`);
      }
    }
  }

  const policiesMatch = policyMismatches.length === 0;

  if (policyMismatches.length > 0) {
    console.log("\n  000034 policy catalog mismatches:");
    for (const m of policyMismatches) console.log(`    - ${m}`);
  } else {
    console.log("\n  000034 policy catalog: founder-only lockdown policies OK");
  }

  return {
    migrationHistoryAvailable,
    historyHas033,
    historyHas034,
    personalBrainCatalog,
    personalBrainFullyPresent,
    personalBrainFullyAbsent,
    policiesMatch,
    policyMismatches,
  };
}

async function main(): Promise<void> {
  if (process.argv.includes("--static")) {
    runStaticChecks();
    process.exit(0);
  }

  const dbUrl = requireDatabaseUrl();
  console.log("verify-live-migration-state\n");
  console.log(`  database: ${maskDatabaseUrl(dbUrl)}`);
  console.log(`  migration 033: ${MIGRATION_033} (must NOT be present in catalog)`);
  console.log(`  migration 034: ${MIGRATION_034} (verified via pg_policies)\n`);

  const migrationSql = readFileSync(
    resolve(process.cwd(), MIGRATION_034_FILE),
    "utf8"
  );
  assert.match(migrationSql, /soda_is_domain_founder/);

  const result = await withPg(dbUrl, async (client) => inspectLiveCatalog(client));

  if (result.personalBrainFullyPresent) {
    console.error(
      "\nFAIL  000033 Personal Brain foundation is present on Production — abort."
    );
    process.exit(11);
  }

  if (!result.personalBrainFullyAbsent) {
    console.log(
      "\n  WARNING  partial 000033 catalog objects — Personal Brain must stay off."
    );
  }

  if (result.policiesMatch) {
    console.log("\nPASS  000034 founder-only policies match catalog — skip reapply.");
    if (!result.migrationHistoryAvailable) {
      console.log(
        "NOTE  migration history absent — catalog verification used; follow-up required."
      );
    }
    process.exit(0);
  }

  console.log("\nACTION  Apply 000034 required (catalog policies missing or mismatched).");
  process.exit(10);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\nFAIL  ${redactSecrets(msg)}`);
  process.exit(1);
});
