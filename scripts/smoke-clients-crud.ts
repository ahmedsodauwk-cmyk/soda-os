/**
 * Sprint 17 — Clients CRUD smoke test against public.clients.
 *
 * Run: npm run smoke:clients
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (and clients RLS policies from 20260711000002_clients_rls.sql, or
 * SUPABASE_SERVICE_ROLE_KEY to bypass RLS).
 */

import {
  createClient,
  deleteClient,
  getAllClients,
  getClientById,
  refreshClients,
  updateClient,
} from "../lib/clients/repository";
import { getSupabaseServiceRoleKey } from "../lib/supabase/env";
import { loadEnvLocal, maskSecret } from "./load-env-local";
import { assertNonProductionTarget } from "./assert-non-production";

async function main() {
  loadEnvLocal();
  assertNonProductionTarget("smoke-clients-crud");

  console.log("=== Clients CRUD smoke ===");
  console.log(
    `  URL: ${maskSecret(process.env.NEXT_PUBLIC_SUPABASE_URL)}`
  );
  console.log(
    `  anon: ${maskSecret(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}`
  );
  console.log(
    `  service_role: ${maskSecret(getSupabaseServiceRoleKey())}`
  );

  const stamp = Date.now();
  const name = `Smoke Client ${stamp}`;

  console.log("\n1. list (refresh)");
  await refreshClients();
  const before = getAllClients().length;
  console.log(`   count=${before}`);

  console.log("\n2. create");
  const created = await createClient({
    type: "individual",
    segment: "wedding",
    name,
    phone: "01000000000",
    email: `smoke-${stamp}@example.com`,
    notes: "sprint-17-smoke",
  });
  console.log(`   id=${created.id} name=${created.name}`);

  console.log("\n3. read");
  await refreshClients();
  const found = getClientById(created.id);
  if (!found || found.name !== name) {
    throw new Error("Created client not found after refresh");
  }
  console.log(`   found=${found.id}`);

  console.log("\n4. update");
  const updated = await updateClient(created.id, {
    phone: "01111111111",
    notes: "sprint-17-smoke-updated",
  });
  if (updated.phone !== "01111111111") {
    throw new Error("Update did not persist phone");
  }
  console.log(`   phone=${updated.phone}`);

  console.log("\n5. delete");
  await deleteClient(created.id);
  await refreshClients();
  if (getClientById(created.id)) {
    throw new Error("Client still present after delete");
  }
  console.log("   deleted ok");

  const after = getAllClients().length;
  if (after !== before) {
    throw new Error(
      `Cache count mismatch after cleanup: before=${before} after=${after}`
    );
  }

  console.log("\n=== PASS ===");
  console.log(JSON.stringify({ ok: true, before, after, id: created.id }));
}

main().catch((err) => {
  console.error("\n=== FAIL ===");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
