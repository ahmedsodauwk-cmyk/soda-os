/**
 * Sprint 19 — Equipment CRUD smoke against public.equipment.
 * Run: npm run smoke:equipment
 */
import {
  createEquipment,
  deleteEquipment,
  getEquipmentById,
  refreshEquipment,
  updateEquipment,
} from "../lib/equipment/repository";
import { loadEnvLocal, maskSecret } from "./load-env-local";
import { assertNonProductionTarget } from "./assert-non-production";

async function main() {
  loadEnvLocal();
  assertNonProductionTarget("smoke-equipment-crud");
  console.log("=== Equipment CRUD smoke ===");
  console.log(`  URL: ${maskSecret(process.env.NEXT_PUBLIC_SUPABASE_URL)}`);

  await refreshEquipment();
  const before = (await refreshEquipment()).length;

  const created = await createEquipment({
    name: `Smoke Cam ${Date.now()}`,
    type: "Camera",
    acquiredAt: new Date().toISOString().slice(0, 10),
    notes: "smoke",
  });
  console.log("create", created.id);

  const updated = await updateEquipment(created.id, {
    notes: "smoke-updated",
    status: "maintenance",
  });
  if (updated.notes !== "smoke-updated") throw new Error("update failed");
  console.log("update ok");

  await deleteEquipment(created.id);
  await refreshEquipment();
  if (getEquipmentById(created.id)) throw new Error("delete failed");
  console.log("delete ok");

  const after = (await refreshEquipment()).length;
  if (after !== before) throw new Error(`count mismatch ${before}→${after}`);
  console.log("=== PASS ===");
}

main().catch((e) => {
  console.error("=== FAIL ===", e instanceof Error ? e.message : e);
  process.exit(1);
});
