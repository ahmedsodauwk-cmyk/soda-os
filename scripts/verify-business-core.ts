/**
 * Verify Business Core tables + write/re-read persistence.
 * Run after applying SODA_BUSINESS_CORE.sql:
 *   NODE_OPTIONS=--use-system-ca npx tsx scripts/verify-business-core.ts
 */

import { createClient } from "@supabase/supabase-js";

import { clearAuditMemory, refreshAuditLogFromDb } from "../lib/core/audit/engine";
import {
  clearBusinessEventMemory,
  listBusinessEvents,
  persistBusinessEvent,
  refreshBusinessEventsFromDb,
} from "../lib/core/events-store";
import type { BusinessEvent } from "../lib/core/types";
import { isSupabaseConfigured } from "../lib/supabase/env";
import { loadEnvLocal, maskSecret } from "./load-env-local";

async function main() {
  loadEnvLocal();
  console.log("=== Verify Business Core ===");
  console.log(
    `  NEXT_PUBLIC_SUPABASE_URL: ${maskSecret(process.env.NEXT_PUBLIC_SUPABASE_URL)}`
  );

  if (!isSupabaseConfigured()) {
    console.error("Supabase not configured");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const table of ["business_events", "audit_log"] as const) {
    const { error } = await client.from(table).select("id").limit(0);
    if (error) {
      console.error(`  ✗ ${table}: ${error.message}`);
      console.error(
        "\nApply SODA_BUSINESS_CORE.sql in Supabase Dashboard → SQL Editor, then re-run."
      );
      process.exit(1);
    }
    console.log(`  ✓ ${table} exists`);
  }

  const id = `bev-verify-${Date.now()}`;
  const event: BusinessEvent = {
    id,
    type: "OrderUpdated",
    occurredAt: new Date().toISOString(),
    source: "scripts.verify-business-core",
    payload: {
      entityId: "verify-entity",
      entityType: "system",
      summary: "Business Core persistence probe",
    },
  };

  clearBusinessEventMemory();
  clearAuditMemory();
  await persistBusinessEvent(event);
  clearBusinessEventMemory();

  const fromDb = await refreshBusinessEventsFromDb(50);
  const found = fromDb.find((e) => e.id === id);
  if (!found) {
    console.error("  ✗ write/re-read FAILED — event not found after refresh");
    process.exit(1);
  }
  console.log(`  ✓ event persisted and re-read (${id})`);

  await refreshAuditLogFromDb(50);
  console.log(`  ✓ memory list after refresh: ${listBusinessEvents(5).length} cached`);

  // cleanup probe row
  await client.from("business_events").delete().eq("id", id);
  await client.from("audit_log").delete().eq("id", `audit-${id}`);

  console.log("\n=== OK ===");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
