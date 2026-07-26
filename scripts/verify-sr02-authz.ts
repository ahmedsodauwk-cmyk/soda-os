/**
 * SR-02 — Authz unit tests for server mutation actions (no Production writes).
 *
 * Run: npx tsx scripts/verify-sr02-authz.ts
 */

import assert from "node:assert/strict";

import { accessLevelCan } from "@/lib/identity/access-levels";
import { buildDataScope, isOrderIdInScope } from "@/lib/identity/data-scope";
import type { SodaSession } from "@/lib/identity/session";
import type { Client } from "@/lib/clients/types";
import type { Order } from "@/lib/orders/types";

let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

function teamSession(personId: string): SodaSession {
  return {
    userId: "team-user",
    email: "crew@sodavisuals.com",
    profile: {
      id: "team-user",
      email: "crew@sodavisuals.com",
      username: "crew",
      fullName: "Crew Member",
      displayName: "Crew Member",
      role: "crew_member",
      accessLevel: "team",
      personId,
      avatarInitials: "CM",
      isActive: true,
      mustChangePassword: false,
    },
  };
}

function founderSession(): SodaSession {
  return {
    userId: "founder-user",
    email: "founder@sodavisuals.com",
    profile: {
      id: "founder-user",
      email: "founder@sodavisuals.com",
      username: "founder",
      fullName: "Founder",
      displayName: "Founder",
      role: "founder",
      accessLevel: "founder",
      personId: null,
      avatarInitials: "FO",
      isActive: true,
      mustChangePassword: false,
    },
  };
}

const sampleOrders = [
  {
    id: "order-a",
    clientId: "client-a",
    clientName: "Client A",
    projectId: "proj-a",
    workspaceId: "weddings",
    projectType: "Wedding",
    status: "Scheduled",
    squadMemberIds: ["person-1"],
    shootDate: "2026-08-01",
    price: 10000,
    createdAt: "2026-07-01",
  },
  {
    id: "order-b",
    clientId: "client-b",
    clientName: "Client B",
    projectId: "proj-b",
    workspaceId: "commercial",
    projectType: "Commercial",
    status: "Scheduled",
    squadMemberIds: [],
    shootDate: "2026-08-02",
    price: 20000,
    createdAt: "2026-07-02",
  },
] as unknown as Order[];

const sampleClients: Client[] = [
  {
    id: "client-a",
    type: "individual",
    segment: "wedding",
    businessRole: "client",
    name: "Client A",
    phone: "0100",
    createdAt: "2026-07-01",
    isActive: true,
  },
  {
    id: "client-b",
    type: "company",
    segment: "commercial",
    businessRole: "client",
    name: "Client B",
    phone: "0200",
    createdAt: "2026-07-01",
    isActive: true,
  },
];

check("signed-out: orders.delete denied via access level", () => {
  assert.equal(accessLevelCan("team", "orders.delete"), false);
  assert.equal(accessLevelCan(null, "orders.delete"), false);
});

check("team cannot create orders", () => {
  assert.equal(accessLevelCan("team", "orders.create"), false);
});

check("founder can delete orders", () => {
  assert.equal(accessLevelCan("founder", "orders.delete"), true);
});

check("team scope includes only assigned orders", () => {
  const scope = buildDataScope(teamSession("person-1"), {
    orders: sampleOrders,
    clients: sampleClients,
  });
  assert.equal(isOrderIdInScope("order-a", scope), true);
  assert.equal(isOrderIdInScope("order-b", scope), false);
});

check("founder scope is company-wide", () => {
  const scope = buildDataScope(founderSession(), {
    orders: sampleOrders,
    clients: sampleClients,
  });
  assert.equal(scope.orderIds, null);
  assert.equal(isOrderIdInScope("order-b", scope), true);
});

check("team IDOR: other person order denied in scope", () => {
  const scope = buildDataScope(teamSession("person-99"), {
    orders: sampleOrders,
    clients: sampleClients,
  });
  assert.equal(isOrderIdInScope("order-a", scope), false);
});

check("payments.edit founder-only", () => {
  assert.equal(accessLevelCan("account_manager", "payments.edit"), false);
  assert.equal(accessLevelCan("founder", "payments.edit"), true);
});

check("clients.manage blocked for team", () => {
  assert.equal(accessLevelCan("team", "clients.manage"), false);
  assert.equal(accessLevelCan("account_manager", "clients.manage"), true);
});

console.log(`\n${passed} authz matrix checks passed.`);
