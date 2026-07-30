/**
 * Client privacy unit checks — AM, TL, Team denied directory; order whitelist only.
 * Run: npx tsx scripts/verify-client-privacy.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  mayBrowseClientDirectory,
  mayLinkToClientProfile,
  orderClientSnapshot,
  ORDER_CLIENT_WHITELIST_KEYS,
} from "../lib/clients/privacy";
import { canAccessPath } from "../lib/identity/module-access";
import type { Order } from "../lib/orders/types";

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

const sampleOrder = {
  id: "ORD-TEST",
  projectId: "PRJ-1",
  clientId: "CLI-SECRET",
  clientName: "Acme Corp",
  projectType: "Commercial",
  status: "Confirmed",
  shootDate: "2026-08-01",
  location: "Cairo Studio",
  whatsapp: "+201000000000",
  phone: "+201000000000",
  price: 50000,
  workspaceId: "ws-1",
  deliveryDate: "2026-08-15",
  deposit: 0,
  team: "Squad",
  squadMemberIds: [],
  priority: "normal",
  brief: "",
  latePenaltyEnabled: false,
  latePenaltyAmount: 0,
  latePenaltyReason: "",
  notes: "",
  packageName: "",
  deliverables: [],
  reelCount: 0,
  plannedExpenses: [],
} as Order;

console.log("verify-client-privacy\n");

for (const level of ["account_manager", "team_leader", "team"] as const) {
  check(`${level} denied client directory browse`, () => {
    assert.equal(mayBrowseClientDirectory(level), false);
  });

  check(`${level} denied client profile link`, () => {
    assert.equal(mayLinkToClientProfile(level), false);
  });

  check(`${level} denied /clients routes`, () => {
    assert.equal(canAccessPath(level, "/clients"), false);
    assert.equal(canAccessPath(level, "/clients/CLI-1"), false);
    assert.equal(canAccessPath(level, "/clients/CLI-1/timeline"), false);
  });

  check(`${level} denied /orders/commercial client directory`, () => {
    assert.equal(canAccessPath(level, "/orders/commercial"), false);
    assert.equal(canAccessPath(level, "/orders/commercial/CLI-1"), false);
  });
}

check("founder allowed client directory", () => {
  assert.equal(mayBrowseClientDirectory("founder"), true);
  assert.equal(canAccessPath("founder", "/clients"), true);
  assert.equal(canAccessPath("founder", "/orders/commercial"), true);
});

check("order snapshot whitelist keys only", () => {
  const snap = orderClientSnapshot(sampleOrder);
  const keys = Object.keys(snap).sort();
  assert.deepEqual(keys, [...ORDER_CLIENT_WHITELIST_KEYS].sort());
  assert.equal(snap.displayName, "Acme Corp");
  assert.equal(snap.projectType, "Commercial");
  assert.equal(snap.segmentLabel, "Commercial");
  assert.equal("id" in snap, false);
  assert.equal("email" in snap, false);
});

check("migration 000035 denies all non-Founder RLS", () => {
  const sql = readRepo(
    "supabase/migrations/20260730000035_client_privacy_non_founder.sql"
  );
  assert.match(sql, /RETURN false;\s*END;/);
  assert.doesNotMatch(sql, /account_manager/);
  assert.doesNotMatch(sql, /team_leader/);
});

check("migration 000035 rollback restores SR-01", () => {
  const rb = readRepo(
    "supabase/migrations/rollback/20260730000035_client_privacy_non_founder_rollback.sql"
  );
  assert.match(rb, /account_manager/);
  assert.match(rb, /team_leader/);
});

check("client actions founder-gated", () => {
  const actions = readRepo("lib/clients/actions.ts");
  assert.match(actions, /requireFounder/);
});

console.log(`\n${passed} checks passed.`);
