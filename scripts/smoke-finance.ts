import {
  createAllocation,
  createFinancialEvent,
  listFinancialEvents,
  refreshFinance,
} from "../lib/finance/repository";
import { createDomainDb } from "../lib/supabase/domain-db";
import { loadEnvLocal } from "./load-env-local";
import { assertNonProductionTarget } from "./assert-non-production";

async function main() {
  loadEnvLocal();
  assertNonProductionTarget("smoke-finance");
  await refreshFinance();
  const before = listFinancialEvents().length;
  const ev = await createFinancialEvent({
    type: "adjustment",
    amount: 1,
    currency: "EGP",
    direction: "inflow",
    parent: { parentType: "company", parentId: "soda" },
    notes: "smoke",
  });
  await createAllocation({
    financialEventId: ev.id,
    amount: 1,
    targetType: "company",
    targetId: "soda",
  });
  const db = createDomainDb();
  await db
    .from("financial_allocations")
    .delete()
    .eq("financial_event_id", ev.id);
  await db.from("financial_events").delete().eq("id", ev.id);
  console.log("=== PASS finance ===", { id: ev.id, before });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
