/**
 * Orders action-menu regression — Team must not see Edit/Delete.
 * Run: npx tsx scripts/verify-orders-action-menu.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  canFounderMutateExisting,
  isFounderAccess,
} from "@/lib/identity/access-levels";

const REPO = process.cwd();
let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

const ordersContent = readFileSync(
  join(REPO, "components/orders/orders-content.tsx"),
  "utf8"
);
const ordersTable = readFileSync(
  join(REPO, "components/orders/orders-table.tsx"),
  "utf8"
);
const ordersActions = readFileSync(join(REPO, "lib/orders/actions.ts"), "utf8");

check("team access level cannot mutate existing records", () => {
  assert.equal(canFounderMutateExisting("team"), false);
  assert.equal(isFounderAccess("team"), false);
});

check("founder can mutate existing records", () => {
  assert.equal(canFounderMutateExisting("founder"), true);
});

check("orders list never unconditionally passes edit/delete handlers", () => {
  assert.doesNotMatch(ordersContent, /onEdit=\{setEditing\}/);
  assert.doesNotMatch(ordersContent, /onDelete=\{handleDeleteOrder\}/);
  assert.match(ordersContent, /canMutateExisting \? setEditing : undefined/);
  assert.match(ordersContent, /canMutateExisting \? handleDeleteOrder : undefined/);
});

check("orders table hides edit/delete when handlers omitted", () => {
  assert.match(ordersTable, /\{onEdit \?/);
  assert.match(ordersTable, /\{onDelete \?/);
  assert.match(ordersTable, /View order/);
});

check("server order mutations founder-gated", () => {
  assert.match(
    ordersActions,
    /updateSmartOrderAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
  assert.match(
    ordersActions,
    /deleteOrderAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
});

check("regression: team would get undefined handlers (no Edit/Delete render)", () => {
  const teamCanMutate = canFounderMutateExisting("team");
  assert.equal(teamCanMutate, false);
  const onEdit = teamCanMutate ? () => {} : undefined;
  const onDelete = teamCanMutate ? () => {} : undefined;
  assert.equal(onEdit, undefined);
  assert.equal(onDelete, undefined);
});

console.log(`\n${passed} orders action-menu regression checks passed.`);
