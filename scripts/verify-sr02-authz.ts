/**
 * SR-02 — Founder-only order/client creation authz (no Production writes).
 * Run: npx tsx scripts/verify-sr02-authz.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  accessLevelCan,
  accessLevelFromLegacyRole,
  isFounderAccess,
  parseAccessLevel,
} from "@/lib/identity/access-levels";
import { buildDataScope, isOrderIdInScope } from "@/lib/identity/data-scope";
import type { SodaSession } from "@/lib/identity/session";
import type { Client } from "@/lib/clients/types";
import type { Order } from "@/lib/orders/types";

const REPO = process.cwd();
let passed = 0;
function check(label: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`PASS  ${label}`);
}
function readRepo(path: string): string {
  return readFileSync(join(REPO, path), "utf8");
}
function canFounderCreate(level: string | null | undefined): boolean {
  const parsed = parseAccessLevel(level);
  return parsed ? isFounderAccess(parsed) : false;
}

const ordersActions = readRepo("lib/orders/actions.ts");
const clientsActions = readRepo("lib/clients/actions.ts");
const integrationActions = readRepo("lib/integration/actions.ts");
const mutationAuth = readRepo("lib/domain/mutation-auth.ts");
const entryActions = readRepo("components/orders/order-entry-actions.tsx");
const clientEntryActions = readRepo("components/clients/client-entry-actions.tsx");

check("1 founder: order create allowed", () => {
  assert.equal(isFounderAccess("founder"), true);
  assert.match(ordersActions, /requireFounder\(\)/);
});
check("2 founder: client create allowed", () => {
  assert.match(clientsActions, /createClientAction[\s\S]*?requireFounder\(\)/);
});
check("3 founder: inline client create allowed", () => {
  assert.match(clientsActions, /createClientInlineAction[\s\S]*?requireFounder\(\)/);
});
check("4 team_leader: order create denied", () => {
  assert.equal(isFounderAccess("team_leader"), false);
});
check("5 team_leader: client create denied", () => {
  assert.equal(isFounderAccess("team_leader"), false);
});
check("6 account_manager: order create denied", () => {
  assert.equal(isFounderAccess("account_manager"), false);
  assert.equal(accessLevelCan("account_manager", "orders.create"), true);
});
check("7 account_manager: client create denied", () => {
  assert.equal(isFounderAccess("account_manager"), false);
  assert.equal(accessLevelCan("account_manager", "clients.manage"), true);
});
check("8 team/crew: create denied", () => {
  assert.equal(canFounderCreate("team"), false);
  assert.equal(canFounderCreate(accessLevelFromLegacyRole("crew_member")), false);
});
check("9 other levels: create denied", () => {
  assert.equal(canFounderCreate("superuser"), false);
});
check("10 signed-out: create denied", () => {
  assert.equal(canFounderCreate(null), false);
});
check("11 invalid profile: create denied", () => {
  assert.equal(canFounderCreate("bogus_level"), false);
});
check("12 identity spoofing: server derives session", () => {
  assert.match(mutationAuth, /resolveSessionForApp/);
  assert.doesNotMatch(ordersActions, /input\.(userId|accessLevel|role|profile)/);
});
check("13 direct actions require founder", () => {
  assert.match(ordersActions, /createSmartOrderAction[\s\S]*?requireFounder\(\)/);
  assert.match(clientsActions, /createClientAction[\s\S]*?requireFounder\(\)/);
});
check("14 all paths covered", () => {
  assert.match(entryActions, /accessLevel === "founder"/);
  assert.match(clientEntryActions, /accessLevel === "founder"/);
  assert.match(integrationActions, /runQuotationConversionFlowAction[\s\S]*?requireFounder\(\)/);
});
check("15 no production writes in verifier", () => {
  const self = readRepo("scripts/verify-sr02-authz.ts");
  assert.doesNotMatch(self, /supabase|createClient\(\)/);
});

check("team scope includes only assigned orders", () => {
  const teamSession = (personId: string): SodaSession => ({
    userId: "team-user",
    email: "crew@sodavisuals.com",
    profile: {
      id: "team-user",
      email: "crew@sodavisuals.com",
      username: "crew",
      fullName: "Crew",
      displayName: "Crew",
      role: "crew_member",
      accessLevel: "team",
      personId,
      avatarInitials: "CM",
      isActive: true,
      mustChangePassword: false,
    },
  });
  const orders = [
    {
      id: "order-a",
      clientId: "c",
      clientName: "A",
      projectId: "p",
      workspaceId: "w",
      projectType: "Wedding",
      status: "Scheduled",
      squadMemberIds: ["person-1"],
      shootDate: "2026-08-01",
      price: 1,
      createdAt: "2026-07-01",
    },
  ] as unknown as Order[];
  const clients = [
    {
      id: "c",
      type: "individual",
      segment: "wedding",
      businessRole: "client",
      name: "A",
      phone: "0",
      createdAt: "2026-07-01",
      isActive: true,
    },
  ] as Client[];
  const scope = buildDataScope(teamSession("person-1"), { orders, clients });
  assert.equal(isOrderIdInScope("order-a", scope), true);
});

console.log(`\n${passed} SR-02 founder-only create authz checks passed.`);
