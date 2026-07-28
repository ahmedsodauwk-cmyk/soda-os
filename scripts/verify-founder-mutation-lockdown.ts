/**
 * Founder-only UPDATE/DELETE lockdown verifier (static).
 * Run: npx tsx scripts/verify-founder-mutation-lockdown.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = process.cwd();
let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

function readRepo(path: string): string {
  return readFileSync(join(REPO, path), "utf8");
}

const mutationAuth = readRepo("lib/domain/mutation-auth.ts");
const ordersActions = readRepo("lib/orders/actions.ts");
const clientsActions = readRepo("lib/clients/actions.ts");
const projectsActions = readRepo("lib/projects/actions.ts");
const quotationsActions = readRepo("lib/quotations/actions.ts");
const integrationActions = readRepo("lib/integration/actions.ts");
const paymentsActions = readRepo("lib/payments/actions.ts");
const equipmentActions = readRepo("lib/equipment/actions.ts");
const ordersContent = readRepo("components/orders/orders-content.tsx");
const ordersTable = readRepo("components/orders/orders-table.tsx");
const orderDetailPage = readRepo("app/(shell)/orders/[id]/page.tsx");
const rlsMigration = readRepo(
  "supabase/migrations/20260728000034_founder_only_update_delete.sql"
);

check("requireFounderMutationAccess exported", () => {
  assert.match(mutationAuth, /export async function requireFounderMutationAccess/);
  assert.match(mutationAuth, /isFounderAccess\(session\.profile\.accessLevel\)/);
  assert.match(mutationAuth, /resolveSessionForApp/);
});

check("orders update/delete/status use founder mutation guard", () => {
  assert.match(
    ordersActions,
    /updateSmartOrderAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
  assert.match(
    ordersActions,
    /applyOrderStatusAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
  assert.match(
    ordersActions,
    /deleteOrderAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
  assert.doesNotMatch(ordersActions, /assertOrderAccess/);
});

check("clients update/delete use founder mutation guard", () => {
  assert.match(
    clientsActions,
    /updateClientAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
  assert.match(
    clientsActions,
    /deleteClientAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
});

check("projects update/delete use founder mutation guard", () => {
  assert.match(
    projectsActions,
    /updateProjectAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
  assert.match(
    projectsActions,
    /deleteProjectAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
});

check("quotations mutations use founder mutation guard", () => {
  assert.match(
    quotationsActions,
    /updateQuotationAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
  assert.match(
    quotationsActions,
    /deleteQuotationAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
  assert.match(
    quotationsActions,
    /moveQuotationStageAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
});

check("integration status/reassign mutations founder-only", () => {
  assert.match(
    integrationActions,
    /assignCrewToOrderAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
  assert.match(
    integrationActions,
    /markShootCompleteAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
});

check("payments update/delete founder-only", () => {
  assert.match(
    paymentsActions,
    /updatePaymentAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
  assert.match(
    paymentsActions,
    /deletePaymentAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
});

check("equipment update/delete/assign founder-only", () => {
  assert.match(
    equipmentActions,
    /updateEquipmentAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
  assert.match(
    equipmentActions,
    /deleteEquipmentAction[\s\S]*?requireFounderMutationAccess\(\)/
  );
});

check("orders UI gates edit/delete on founder hook", () => {
  assert.match(ordersContent, /useCanFounderMutateExisting/);
  assert.match(ordersContent, /onEdit=\{canMutateExisting \? setEditing : undefined\}/);
  assert.match(ordersContent, /onDelete=\{canMutateExisting \? handleDeleteOrder : undefined\}/);
});

check("orders table keeps view-only menu items", () => {
  assert.match(ordersTable, /View order/);
  assert.match(ordersTable, /\{onEdit \?/);
  assert.match(ordersTable, /\{onDelete \?/);
});

check("order detail capabilities founder-only", () => {
  assert.match(orderDetailPage, /canFounderMutateExisting/);
  assert.doesNotMatch(orderDetailPage, /canEditOps/);
  assert.doesNotMatch(orderDetailPage, /canUpdateOrderStatus/);
});

check("RLS migration founder-only UPDATE/DELETE", () => {
  assert.match(rlsMigration, /sr01_orders_update[\s\S]*?soda_is_domain_founder/);
  assert.match(rlsMigration, /sr01_orders_delete[\s\S]*?soda_is_domain_founder/);
  assert.match(rlsMigration, /sr01_clients_update[\s\S]*?soda_is_domain_founder/);
  assert.doesNotMatch(
    rlsMigration,
    /sr01_orders_update[\s\S]*?soda_can_access_order/
  );
});

console.log(`\n${passed} founder mutation lockdown checks passed.`);
