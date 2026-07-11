/**
 * Sprint 16 — Supabase activation smoke test.
 *
 * Run: npm run supabase:health
 *
 * Checks env → API reachability → expected tables → reversible read/write.
 * Exits 0 only when connection + read + write all succeed.
 */

import { createClient } from "@supabase/supabase-js";

import { checkSupabaseConnection } from "../lib/supabase/health";
import { isSupabaseConfigured } from "../lib/supabase/env";
import { loadEnvLocal, maskSecret } from "./load-env-local";

const EXPECTED_TABLES = [
  "workspaces",
  "workspace_subcategories",
  "clients",
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
  "_connection_tests",
] as const;

type TableProbe = { table: string; ok: boolean; detail?: string };

function printEnvReport(envFileFound: boolean) {
  console.log("\n=== Environment ===");
  console.log(`  .env.local: ${envFileFound ? "found" : "MISSING"}`);
  console.log(
    `  NEXT_PUBLIC_SUPABASE_URL: ${maskSecret(process.env.NEXT_PUBLIC_SUPABASE_URL)}`
  );
  console.log(
    `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${maskSecret(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}`
  );
  console.log(
    `  SUPABASE_SERVICE_ROLE_KEY: ${maskSecret(process.env.SUPABASE_SERVICE_ROLE_KEY)} (optional)`
  );
  console.log(
    `  configured (non-placeholder): ${isSupabaseConfigured() ? "yes" : "no"}`
  );
}

function printDashboardInstructions() {
  console.log(`
=== How to configure Supabase (do this first) ===

1. Open Supabase Dashboard → your project → Project Settings → API
2. Copy these values:
   • Project URL          → paste as NEXT_PUBLIC_SUPABASE_URL in .env.local
   • anon public key      → paste as NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
   • service_role key     → optional; paste as SUPABASE_SERVICE_ROLE_KEY in .env.local
                            (server/migrations only — NEVER expose to the browser or commit it)

3. File: .env.local (repo root). Keys must match .env.example:
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   # SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

4. Apply migrations (pick one):
   • Dashboard: SQL Editor → run supabase/migrations/20260711000000_init.sql
     then supabase/migrations/20260711000001_connection_tests.sql
   • CLI (if installed & logged in): supabase link && supabase db push

5. Re-run: npm run supabase:health
`);
}

async function probeTables(
  url: string,
  anonKey: string
): Promise<TableProbe[]> {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: TableProbe[] = [];
  for (const table of EXPECTED_TABLES) {
    const { error } = await client.from(table).select("*").limit(0);
    if (!error) {
      results.push({ table, ok: true });
      continue;
    }
    const msg = error.message ?? String(error);
    const missing =
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      /could not find the table|relation .* does not exist|schema cache/i.test(
        msg
      );
    results.push({
      table,
      ok: false,
      detail: missing ? "missing (apply migrations)" : msg,
    });
  }
  return results;
}

async function readWriteTest(
  url: string,
  anonKey: string
): Promise<{ read: boolean; write: boolean; detail?: string }> {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const note = `soda-os-sprint16-${Date.now()}`;

  const { data: inserted, error: insertError } = await client
    .from("_connection_tests")
    .insert({ note })
    .select("id, note")
    .single();

  if (insertError || !inserted?.id) {
    return {
      read: false,
      write: false,
      detail: insertError?.message ?? "insert returned no row",
    };
  }

  const { data: readRow, error: readError } = await client
    .from("_connection_tests")
    .select("id, note")
    .eq("id", inserted.id)
    .single();

  const readOk = !readError && readRow?.note === note;

  const { error: deleteError } = await client
    .from("_connection_tests")
    .delete()
    .eq("id", inserted.id);

  if (deleteError) {
    return {
      read: readOk,
      write: false,
      detail: `insert ok but cleanup failed: ${deleteError.message}`,
    };
  }

  return {
    read: readOk,
    write: true,
    detail: readOk ? undefined : readError?.message ?? "read mismatch",
  };
}

async function main() {
  const envFileFound = loadEnvLocal();
  printEnvReport(envFileFound);

  if (!isSupabaseConfigured()) {
    printDashboardInstructions();
    console.log(
      JSON.stringify(
        {
          configured: false,
          ok: false,
          migrationCompleted: false,
          connectionOk: false,
          readOk: false,
          writeOk: false,
          message:
            "Blocked: .env.local has placeholder or missing credentials. Fill real values from the Supabase dashboard, then re-run.",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();

  console.log("\n=== Connection ===");
  const health = await checkSupabaseConnection();
  console.log(`  ${health.message}${health.detail ? ` (${health.detail})` : ""}`);

  console.log("\n=== Tables ===");
  const tables = await probeTables(url, anonKey);
  const present = tables.filter((t) => t.ok);
  const missing = tables.filter((t) => !t.ok);
  for (const t of tables) {
    console.log(`  ${t.ok ? "✓" : "✗"} ${t.table}${t.detail ? ` — ${t.detail}` : ""}`);
  }

  let readOk = false;
  let writeOk = false;
  let rwDetail: string | undefined;

  if (present.some((t) => t.table === "_connection_tests")) {
    console.log("\n=== Read / write smoke test ===");
    const rw = await readWriteTest(url, anonKey);
    readOk = rw.read;
    writeOk = rw.write;
    rwDetail = rw.detail;
    console.log(`  write (insert+delete): ${writeOk ? "PASS" : "FAIL"}`);
    console.log(`  read: ${readOk ? "PASS" : "FAIL"}`);
    if (rwDetail) console.log(`  detail: ${rwDetail}`);
  } else {
    console.log(
      "\n=== Read / write smoke test ===\n  SKIPPED — apply migration 20260711000001_connection_tests.sql first"
    );
  }

  const migrationCompleted = missing.length === 0;
  const ok = health.ok && migrationCompleted && readOk && writeOk;

  const report = {
    configured: true,
    ok,
    migrationCompleted,
    connectionOk: health.ok,
    tablesPresent: present.map((t) => t.table),
    tablesMissing: missing.map((t) => t.table),
    readOk,
    writeOk,
    detail: rwDetail ?? health.detail,
  };

  console.log("\n=== Summary ===");
  console.log(JSON.stringify(report, null, 2));

  if (!migrationCompleted) {
    console.log(
      "\nApply migrations via SQL Editor or `supabase db push`, then re-run."
    );
  }

  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
