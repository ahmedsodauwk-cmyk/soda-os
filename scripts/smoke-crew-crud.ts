/**
 * Sprint 18 — People/Crew CRUD smoke test against public.people.
 *
 * Run: npm run smoke:crew
 */

import {
  createPerson,
  deletePerson,
  getAllPeople,
  getPersonById,
  refreshPeople,
  updatePerson,
} from "../lib/people/repository";
import { getSupabaseServiceRoleKey } from "../lib/supabase/env";
import { loadEnvLocal, maskSecret } from "./load-env-local";

async function main() {
  loadEnvLocal();

  console.log("=== Crew/People CRUD smoke ===");
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

  console.log("\n1. list (refresh)");
  await refreshPeople();
  const before = getAllPeople().length;
  console.log(`   count=${before}`);

  console.log("\n2. create");
  const created = await createPerson({
    nameAr: "تجربة",
    nameEn: `Smoke Crew ${stamp}`,
    jobTitle: "Tester",
    jobDescription: "Smoke test",
    employmentType: "freelance",
    responsibilities: ["Photography"],
    phone: "01000000000",
    email: `smoke-crew-${stamp}@example.com`,
    joinDate: new Date().toISOString().slice(0, 10),
    status: "active",
  });
  console.log(`   id=${created.id} name=${created.nameEn}`);

  console.log("\n3. read");
  await refreshPeople();
  const found = getPersonById(created.id);
  if (!found || found.nameEn !== created.nameEn) {
    throw new Error("Created person not found after refresh");
  }
  console.log(`   found=${found.id}`);

  console.log("\n4. update");
  const updated = await updatePerson(created.id, {
    phone: "01111111111",
    jobTitle: "Lead Tester",
  });
  if (updated.phone !== "01111111111" || updated.jobTitle !== "Lead Tester") {
    throw new Error("Update did not persist");
  }
  console.log(`   phone=${updated.phone} title=${updated.jobTitle}`);

  console.log("\n5. delete");
  await deletePerson(created.id);
  await refreshPeople();
  if (getPersonById(created.id)) {
    throw new Error("Person still present after delete");
  }
  console.log("   deleted ok");

  const after = getAllPeople().length;
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
