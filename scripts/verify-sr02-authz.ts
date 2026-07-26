/**
 * SR-02 order-create authz verifier (tests 1-9). Run: npx tsx scripts/verify-sr02-order-create.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { accessLevelCan, accessLevelFromLegacyRole, parseAccessLevel } from "@/lib/identity/access-levels";

const REPO = process.cwd();
let passed = 0;
const check = (l: string, fn: () => void) => { fn(); passed++; console.log(`PASS  ${l}`); };
const readRepo = (p: string) => readFileSync(join(REPO, p), "utf8");
const ordersActions = readRepo("lib/orders/actions.ts");
const mutationAuth = readRepo("lib/domain/mutation-auth.ts");
const entryActions = readRepo("components/orders/order-entry-actions.tsx");

check("1 founder allowed", () => assert.equal(accessLevelCan("founder", "orders.create"), true));
check("2 team_leader allowed", () => assert.equal(accessLevelCan("team_leader", "orders.create"), true));
check("3 account_manager allowed", () => assert.equal(accessLevelCan("account_manager", "orders.create"), true));
check("4 team/crew denied", () => {
  assert.equal(accessLevelCan("team", "orders.create"), false);
  assert.equal(accessLevelCan(accessLevelFromLegacyRole("crew_member"), "orders.create"), false);
});
check("5 unknown denied", () => assert.equal(accessLevelCan("superuser", "orders.create"), false));
check("6 signed-out denied", () => assert.equal(accessLevelCan(null, "orders.create"), false));
check("7 invalid profile denied", () => {
  assert.equal(parseAccessLevel("bogus"), null);
  assert.equal(accessLevelCan("bogus", "orders.create"), false);
});
check("8 no identity spoofing", () => {
  assert.match(ordersActions, /requirePermission\("orders\.create"\)/);
  assert.match(mutationAuth, /resolveSessionForApp/);
});
check("9 protected boundary", () => {
  assert.match(ordersActions, /createSmartOrderAction[\s\S]*?requirePermission\("orders\.create"\)/);
  assert.match(entryActions, /orders\.create/);
  assert.doesNotMatch(entryActions, /\bcreateSmartOrder\s*\(/);
});
console.log(`\n${passed} order-create authz checks passed.`);
