/**
 * SR-01 — Core Domain RLS verification harness.
 * Static checks always run. Live DB checks when DATABASE_URL / SUPABASE_DB_PASSWORD set.
 * Never prints secrets, PII, or row contents.
 *
 * Run: npx tsx scripts/verify-sr01-rls.ts
 * Optional: npx tsx scripts/verify-sr01-rls.ts --live
 */

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { loadEnvLocal, maskSecret } from "./load-env-local";

const REPO = process.cwd();
const MIGRATION = "supabase/migrations/20260726000028_sr01_core_domain_rls_lockdown.sql";
const ROLLBACK =
  "supabase/rollbacks/20260726000028_sr01_core_domain_rls_lockdown_rollback.sql";

const C1_TABLES = [
  "workspaces",
  "workspace_subcategories",
  "people",
  "equipment",
  "equipment_assignments",
  "projects",
  "orders",
  "order_assignments",
  "quotations",
  "payments",
  "invoices",
  "deliveries",
  "financial_events",
  "financial_allocations",
  "files",
  "clients",
  "expenses",
  "account_transfers",
  "period_closings",
  "cash_accounts",
  "cash_account_movements",
  "crew_earnings",
  "business_events",
  "audit_log",
] as const;

const SR01_HELPERS = [
  "soda_is_domain_founder",
  "soda_is_active_authenticated",
  "soda_profile_access_level",
  "soda_profile_person_id",
  "soda_profile_display_name",
  "soda_order_assigned_to_person",
  "soda_person_shares_order_with",
  "soda_can_access_order",
  "soda_can_access_client",
  "soda_can_access_person",
  "soda_can_access_project",
  "soda_can_access_quotation",
] as const;

function projectRefFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.split(".")[0] || undefined;
  } catch {
    return undefined;
  }
}

function resolveDatabaseUrl(): string | null {
  const direct =
    process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DIRECT_URL?.trim() ||
    null;
  if (direct) return direct;

  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    process.env.POSTGRES_PASSWORD?.trim();
  const ref = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (password && ref) {
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }
  return null;
}

let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

function readText(rel: string): string {
  const p = resolve(REPO, rel);
  assert.ok(existsSync(p), `missing file: ${rel}`);
  return readFileSync(p, "utf8");
}

function runStaticChecks(): void {
  const sql = readText(MIGRATION);
  const rollback = readText(ROLLBACK);

  check("migration file exists", () => {
    assert.ok(sql.includes("SR-01"));
  });

  check("rollback file exists", () => {
    assert.ok(rollback.includes("SR-01 rollback"));
  });

  check("no USING (true) for anon on C1 in migration", () => {
    assert.doesNotMatch(sql, /FOR\s+SELECT\s+TO\s+anon\s+USING\s*\(\s*true\s*\)/i);
    assert.doesNotMatch(sql, /FOR\s+ALL\s+TO\s+anon/i);
    assert.doesNotMatch(sql, /TO\s+anon\s+WITH\s+CHECK\s*\(\s*true\s*\)/i);
  });

  check("SECURITY DEFINER helpers set search_path", () => {
    const blocks = sql.split("CREATE OR REPLACE FUNCTION public.soda_");
    for (const block of blocks.slice(1)) {
      if (!block.includes("SECURITY DEFINER")) continue;
      assert.match(block, /SET\s+search_path\s*=\s*public/i);
      assert.match(block, /SET\s+row_security\s*=\s*off/i);
    }
  });

  check("all C1 tables referenced in migration", () => {
    for (const t of C1_TABLES) {
      assert.match(sql, new RegExp(`public\\.${t}`, "i"));
    }
  });

  check("revokes anon grants", () => {
    assert.match(sql, /FROM anon/i);
  });

  check("precondition checks profiles.access_level", () => {
    assert.match(sql, /profiles\.access_level/);
  });

  check("rollback restores permissive clients policies", () => {
    assert.match(rollback, /clients_select_anon/);
  });

  for (const helper of SR01_HELPERS) {
    check(`migration defines ${helper}()`, () => {
      assert.match(sql, new RegExp(`FUNCTION public\\.${helper}`));
    });
  }
}

type PgClient = import("pg").Client;

function normalizePgTextArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || value.length === 0) return [];
  const trimmed = value.replace(/^\{|\}$/g, "");
  if (!trimmed) return [];
  return trimmed.split(",").map((s) => s.replace(/^"|"$/g, ""));
}

function isLocalDatabaseUrl(connectionString: string): boolean {
  try {
    const host = new URL(connectionString).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

async function withPg<T>(
  connectionString: string,
  fn: (client: PgClient) => Promise<T>
): Promise<T> {
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString,
    ...(isLocalDatabaseUrl(connectionString)
      ? {}
      : { ssl: { rejectUnauthorized: false } }),
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function runLiveChecks(connectionString: string): Promise<void> {
  await withPg(connectionString, async (client) => {
    async function liveCheck(label: string, fn: () => Promise<void>): Promise<void> {
      await fn();
      passed += 1;
      console.log(`PASS  ${label}`);
    }

    await liveCheck("live: SR-01 helper functions exist", async () => {
      const r = await client.query<{ proname: string }>(
        `SELECT proname FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public'
           AND proname LIKE 'soda_%'`
      );
      const names = new Set(r.rows.map((x) => x.proname));
      for (const h of SR01_HELPERS) {
        assert.ok(names.has(h), `missing function ${h}`);
      }
    });

    await liveCheck("live: no permissive anon policies on C1 tables", async () => {
      const r = await client.query<{
        tablename: string;
        policyname: string;
        qual: string | null;
        with_check: string | null;
        roles: string[];
      }>(
        `SELECT c.relname AS tablename, p.polname AS policyname,
                pg_get_expr(p.polqual, p.polrelid) AS qual,
                pg_get_expr(p.polwithcheck, p.polrelid) AS with_check,
                ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(p.polroles)) AS roles
         FROM pg_policy p
         JOIN pg_class c ON c.oid = p.polrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relname = ANY($1::text[])`,
        [C1_TABLES]
      );

      for (const row of r.rows) {
        const roleHit = normalizePgTextArray(row.roles).some((role) => role === "anon");
        if (!roleHit) continue;
        const permissive =
          row.qual === "true" ||
          row.with_check === "true" ||
          (row.qual === null && row.with_check === null);
        assert.ok(!permissive, `permissive anon policy ${row.policyname} on ${row.tablename}`);
      }
    });

    await liveCheck("live: anon SELECT on clients denied", async () => {
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL role anon");
        try {
          const r = await client.query(
            "SELECT id FROM public.clients LIMIT 1"
          );
          assert.equal(r.rowCount, 0);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          // SR-01 revokes anon table grants; 42501 is acceptable denial.
          assert.match(msg, /permission denied|42501/i);
        }
      } finally {
        await client.query("ROLLBACK");
      }
    });

    await liveCheck("live: no 42P17 on profiles select for authenticated", async () => {
      await client.query("BEGIN");
      try {
        const founder = await client.query<{ id: string }>(
          `SELECT id FROM public.profiles
           WHERE access_level = 'founder' AND is_active = true
           LIMIT 1`
        );
        if (founder.rowCount === 0) {
          console.log("SKIP  live: no founder profile for JWT simulation");
          return;
        }
        const uid = founder.rows[0]!.id;
        await client.query(
          `SET LOCAL request.jwt.claim.sub = '${uid}'`
        );
        await client.query("SET LOCAL role authenticated");
        const r = await client.query(
          "SELECT id FROM public.profiles WHERE id = $1",
          [uid]
        );
        assert.ok(r.rowCount !== null && r.rowCount >= 0);
      } finally {
        await client.query("ROLLBACK");
      }
    });

    await liveCheck("live: write probe rolled back (clients)", async () => {
      const before = await client.query<{ n: string }>(
        "SELECT count(*)::text AS n FROM public.clients"
      );
      const n0 = before.rows[0]?.n ?? "0";

      await client.query("BEGIN");
      try {
        const founder = await client.query<{ id: string }>(
          `SELECT id FROM public.profiles
           WHERE access_level = 'founder' AND is_active = true LIMIT 1`
        );
        if (founder.rowCount === 0) {
          console.log("SKIP  live: founder write probe — no founder profile");
          return;
        }
        const uid = founder.rows[0]!.id;
        await client.query(`SET LOCAL request.jwt.claim.sub = '${uid}'`);
        await client.query("SET LOCAL role authenticated");
        await client.query(
          `INSERT INTO public.clients (id, type, segment, name)
           VALUES ('sr01-probe-client', 'individual', 'wedding', 'SR01 Probe')`
        );
        throw new Error("force rollback");
      } catch (e) {
        if (e instanceof Error && e.message === "force rollback") {
          await client.query("ROLLBACK");
        } else {
          await client.query("ROLLBACK");
          throw e;
        }
      }

      const after = await client.query<{ n: string }>(
        "SELECT count(*)::text AS n FROM public.clients"
      );
      assert.equal(after.rows[0]?.n, n0);
    });
  });
}

async function main(): Promise<void> {
  const live = process.argv.includes("--live");
  loadEnvLocal();

  console.log("SR-01 verify-sr01-rls\n");
  console.log(`  migration: ${MIGRATION}`);
  console.log(`  rollback:  ${ROLLBACK}`);
  console.log(`  C1 tables: ${C1_TABLES.length}`);
  console.log(`  project:   ${projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? "(unknown)"}`);
  console.log(`  DATABASE:  ${maskSecret(resolveDatabaseUrl() ?? undefined)}\n`);

  runStaticChecks();

  const dbUrl = resolveDatabaseUrl();
  if (live && dbUrl) {
    console.log("\n--- Live database checks ---\n");
    await runLiveChecks(dbUrl);
  } else if (live && !dbUrl) {
    console.log("\nSKIP  live checks — no DATABASE_URL / SUPABASE_DB_PASSWORD\n");
    process.exit(2);
  }

  console.log(`\n${passed} checks passed.`);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\nFAIL  ${msg.replace(/postgresql:\/\/[^\s]+/gi, "[redacted]")}`);
  process.exit(1);
});
