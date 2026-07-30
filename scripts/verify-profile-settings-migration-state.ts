/**
 * Live migration reconciliation for profile-settings release (000035 + 000036).
 * DATABASE_URL from process env only. Never loads .env.local.
 *
 * Exit codes:
 *   0  — 000035 function + 000036 storage catalog match (skip reapply)
 *  10 — 000035 client privacy function mismatch (apply required)
 *  12 — 000035 OK; 000036 storage bucket/policies mismatch (apply required)
 *  11 — 000033 Personal Brain present (fatal)
 *   1  — catalog query failure
 *
 * Run:
 *   npx tsx scripts/verify-profile-settings-migration-state.ts
 *   npx tsx scripts/verify-profile-settings-migration-state.ts --static
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

const MIGRATION_035_FILE =
  "supabase/migrations/20260730000035_client_privacy_non_founder.sql";
const MIGRATION_036_FILE =
  "supabase/migrations/20260730000036_profile_avatars_storage.sql";

const AVATAR_POLICIES = [
  "profile_avatars_select",
  "profile_avatars_insert",
  "profile_avatars_update",
  "profile_avatars_delete",
] as const;

const PERSONAL_BRAIN_TABLES = [
  "personal_brain_entries",
  "personal_brain_entry_history",
  "personal_brain_chat_messages",
] as const;

const EXPECTED_035_IDENTITY_ARGS = "p_client_id text";

function runStaticChecks(): void {
  const sql035 = readFileSync(resolve(process.cwd(), MIGRATION_035_FILE), "utf8");
  const sql036 = readFileSync(resolve(process.cwd(), MIGRATION_036_FILE), "utf8");
  assert.match(sql035, /soda_can_access_client/);
  assert.match(sql035, /RETURN false;/);
  assert.doesNotMatch(sql035, /account_manager/);
  assert.match(sql036, /profile-avatars/);
  for (const pol of AVATAR_POLICIES) {
    assert.match(sql036, new RegExp(pol));
  }
  console.log("PASS  static migration SQL files OK");
}

function stripSqlComments(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

type ClientPrivacyCatalogRow = {
  prosecdef: boolean;
  proconfig: string[] | null;
  identity_args: string;
  def: string;
  prosrc: string;
};

function clientPrivacyMatchesCatalog(row: ClientPrivacyCatalogRow | undefined): {
  ok: true;
} | {
  ok: false;
  fail: string;
} {
  if (!row) {
    return {
      ok: false,
      fail: "FAIL verify 000035 function: public.soda_can_access_client not found",
    };
  }

  if (row.identity_args !== EXPECTED_035_IDENTITY_ARGS) {
    return {
      ok: false,
      fail: `FAIL verify 000035 function: argument signature mismatch (expected ${EXPECTED_035_IDENTITY_ARGS}, got ${row.identity_args})`,
    };
  }

  const def = row.def;
  if (!/SECURITY DEFINER/i.test(def)) {
    return {
      ok: false,
      fail: "FAIL verify 000035 function: missing SECURITY DEFINER",
    };
  }
  if (!row.prosecdef) {
    return {
      ok: false,
      fail: "FAIL verify 000035 function: prosecdef is false",
    };
  }

  const config = row.proconfig ?? [];
  const searchPathOk =
    config.some((c) => /^search_path=public$/i.test(c)) ||
    /SET\s+search_path\s*=\s*public/i.test(def);
  if (!searchPathOk) {
    return {
      ok: false,
      fail: "FAIL verify 000035 function: search_path must include public",
    };
  }

  const rowSecurityOk =
    config.some((c) => /^row_security=off$/i.test(c)) ||
    /SET\s+row_security\s*=\s*off/i.test(def);
  if (!rowSecurityOk) {
    return {
      ok: false,
      fail: "FAIL verify 000035 function: row_security must be off",
    };
  }

  const body = stripSqlComments(row.prosrc).toLowerCase();
  if (!/auth\.uid\(\)\s+is\s+null/.test(body)) {
    return {
      ok: false,
      fail: "FAIL verify 000035 function: missing auth.uid() IS NULL guard",
    };
  }
  if (!/if\s+auth\.uid\(\)\s+is\s+null\s+then[\s\S]*?return\s+false/.test(body)) {
    return {
      ok: false,
      fail: "FAIL verify 000035 function: unauthenticated must RETURN false",
    };
  }

  if (!/soda_is_domain_founder\s*\(\)/.test(body)) {
    return {
      ok: false,
      fail: "FAIL verify 000035 function: missing soda_is_domain_founder() check",
    };
  }
  if (!/soda_is_domain_founder\s*\(\)[\s\S]*?return\s+true/.test(body)) {
    return {
      ok: false,
      fail: "FAIL verify 000035 function: Founder path must RETURN true",
    };
  }

  if (!/return\s+false\s*;?\s*end\s*;?\s*$/i.test(body.trim())) {
    return {
      ok: false,
      fail: "FAIL verify 000035 function: non-Founder fallback must RETURN false",
    };
  }

  if (/account_manager|team_leader/.test(body)) {
    return {
      ok: false,
      fail: "FAIL verify 000035 function: AM/TL allowance detected in function body",
    };
  }

  return { ok: true };
}

async function main(): Promise<void> {
  if (process.argv.includes("--static")) {
    console.log("verify-profile-settings-migration-state (static)\n");
    runStaticChecks();
    process.exit(0);
  }

  const dbUrl = requireDatabaseUrl();
  console.log("verify-profile-settings-migration-state\n");
  console.log(`  database: ${maskDatabaseUrl(dbUrl)}`);
  console.log("  migration 035: client privacy function catalog");
  console.log("  migration 036: profile-avatars storage catalog\n");

  runStaticChecks();

  let exitCode = 0;

  await withPg(dbUrl, async (client) => {
    const brain = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relname = ANY($1::text[])
           AND c.relkind = 'r'
       ) AS exists`,
      [PERSONAL_BRAIN_TABLES]
    );
    if (brain.rows[0]?.exists === true) {
      console.error("\nFAIL  000033 Personal Brain tables present — abort.");
      exitCode = 11;
      return;
    }

    console.log("RUN  verify 000035 function");
    const fn = await client.query<ClientPrivacyCatalogRow>(
      `SELECT
         p.prosecdef,
         p.proconfig,
         pg_get_function_identity_arguments(p.oid) AS identity_args,
         pg_get_functiondef(p.oid) AS def,
         p.prosrc
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.proname = 'soda_can_access_client'
         AND pg_get_function_identity_arguments(p.oid) = $1
       LIMIT 1`,
      [EXPECTED_035_IDENTITY_ARGS]
    );
    const privacyCheck = clientPrivacyMatchesCatalog(fn.rows[0]);
    if (!privacyCheck.ok) {
      console.log(privacyCheck.fail);
      console.log("\nACTION  Apply 000035 required (soda_can_access_client mismatch).");
      exitCode = 10;
      return;
    }
    console.log("PASS verify 000035 function");

    const bucket = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM storage.buckets WHERE id = 'profile-avatars'
       ) AS exists`
    );
    if (bucket.rows[0]?.exists !== true) {
      console.log("\nACTION  Apply 000036 required (profile-avatars bucket missing).");
      exitCode = 12;
      return;
    }

    for (const pol of AVATAR_POLICIES) {
      const r = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM pg_policy p
           JOIN pg_class c ON c.oid = p.polrelid
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'storage'
             AND c.relname = 'objects'
             AND p.polname = $1
         ) AS exists`,
        [pol]
      );
      if (r.rows[0]?.exists !== true) {
        console.log(`\nACTION  Apply 000036 required (policy ${pol} missing).`);
        exitCode = 12;
        return;
      }
    }

    const insertPol = await client.query<{ with_check: string | null }>(
      `SELECT pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
       FROM pg_policy p
       JOIN pg_class c ON c.oid = p.polrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'storage'
         AND c.relname = 'objects'
         AND p.polname = 'profile_avatars_insert'
       LIMIT 1`
    );
    const withCheck = insertPol.rows[0]?.with_check ?? "";
    if (!/auth\.uid\(\)/i.test(withCheck) || !/foldername/i.test(withCheck)) {
      console.log("\nACTION  Apply 000036 required (ownership policy mismatch).");
      exitCode = 12;
      return;
    }

    console.log("\nPASS  000036 profile-avatars bucket and policies match catalog.");
    console.log("\nPASS  profile-settings migrations reconciled — skip reapply.");
  });

  process.exit(exitCode);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\nFAIL  ${redactSecrets(msg)}`);
  process.exit(1);
});